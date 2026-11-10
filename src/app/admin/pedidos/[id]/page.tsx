'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { formatPhone } from '@/features/admin/lib/format-phone';
import {
  deliveryLabel,
  formatOrderDate,
  FULFILLMENT_LABELS,
  ORDER_STATUS_SINGULAR,
} from '@/features/admin/lib/site-order-labels';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { FormField } from '@/features/admin/components/FormField';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BusyRegion } from '@/features/admin/components/AdminList';
import { ErrorAlert, ErrorText, LoadingState } from '@/features/admin/components/StatusMessage';
import type { FulfillmentStatus, SiteOrderAdmin } from '@/features/admin/types/admin';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-sand-line p-4">
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-berry uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Um pedido do site: cliente, entrega, itens, pagamento, preparo e cancelamento. */
export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useApiClient();
  const { data: order, isLoading, isRefreshing, error, refetch } = useApiResource<SiteOrderAdmin>(
    `/site-orders/${id}`,
  );
  const fulfillment = useApiMutation('Erro ao atualizar o preparo.');
  const cancel = useApiMutation('Erro ao cancelar o pedido.');
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (isLoading) return <LoadingState />;
  if (!order) return <ErrorAlert>{error ?? 'Pedido não encontrado.'}</ErrorAlert>;

  async function changeFulfillment(value: FulfillmentStatus) {
    const ok = await fulfillment.run(() =>
      apiFetch(`/site-orders/${id}/fulfillment`, {
        method: 'PATCH',
        body: JSON.stringify({ fulfillmentStatus: value }),
      }),
    );
    if (ok) refetch();
  }

  async function confirmCancel() {
    const ok = await cancel.run(() => apiFetch(`/site-orders/${id}/cancel`, { method: 'POST' }));
    if (ok) {
      setConfirmingCancel(false);
      refetch();
    }
  }

  const phoneDigits = order.customer.phone.replace(/\D/g, '');
  const canCancel = order.status === 'paid' || order.status === 'pending_payment';
  const maxLeadTime = Math.max(0, ...order.items.map((i) => i.leadTimeDays ?? 0));

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="mb-2 inline-flex w-fit items-center gap-1 text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
      >
        ← Voltar para pedidos
      </Link>
      <PageHeader title={`Pedido ${order.code}`}>
        <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold">{ORDER_STATUS_SINGULAR[order.status]}</span>
      </PageHeader>
      <p className="mt-1 text-sm text-ink-soft">
        Feito em {formatOrderDate(order.createdAt)}
        {order.paidAt && ` · pago em ${formatOrderDate(order.paidAt)}`}
      </p>
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <BusyRegion busy={isRefreshing || fulfillment.isPending} className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Cliente">
          <p className="font-medium">{order.customer.name}</p>
          <p>
            <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className="text-moss underline">
              {formatPhone(phoneDigits)}
            </a>
          </p>
          <p>
            <a href={`mailto:${order.customer.email}`} className="text-moss underline">
              {order.customer.email}
            </a>
          </p>
        </Section>

        <Section title={deliveryLabel(order)}>
          {order.address ? (
            <>
              <p>
                {order.address.street}, {order.address.number}
                {order.address.complement && ` · ${order.address.complement}`}
              </p>
              <p>
                {order.address.bairro} · CEP {order.address.cep}
              </p>
              <p className="text-sm text-ink-soft">
                {order.address.zone} · área {order.address.area}
              </p>
            </>
          ) : (
            <p>O cliente retira no ateliê.</p>
          )}
          {maxLeadTime > 0 && (
            <p className="mt-2 text-sm text-ink-soft">Tem item sob encomenda: até {maxLeadTime} dias de confecção.</p>
          )}
          {order.notes && <p className="mt-2 rounded bg-sand p-2 text-sm">Observação: {order.notes}</p>}
        </Section>

        <Section title="Itens">
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.name}`} className="flex justify-between gap-3">
                <span>
                  {item.quantity}× {item.name}
                  {item.leadTimeDays && (
                    <span className="block text-sm text-ink-soft">Sob encomenda · até {item.leadTimeDays} dias</span>
                  )}
                </span>
                <span className="tabular-nums">{formatCurrency(item.unitPrice * item.quantity, 'BRL')}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-sand-line pt-2 text-sm">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal, 'BRL')}</span>
            </p>
            <p className="flex justify-between">
              <span>Entrega</span>
              <span className="tabular-nums">{formatCurrency(order.deliveryFee, 'BRL')}</span>
            </p>
            <p className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.total, 'BRL')}</span>
            </p>
          </div>
        </Section>

        <Section title="Preparo e pagamento">
          {order.status === 'paid' ? (
            <FormField id="fulfillment" label="Preparo" error={fulfillment.error}>
              <NativeSelect
                id="fulfillment"
                value={order.fulfillmentStatus}
                onChange={(e) => changeFulfillment(e.target.value as FulfillmentStatus)}
                disabled={fulfillment.isPending}
                className="w-auto"
              >
                {Object.entries(FULFILLMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : (
            <p className="text-sm text-ink-soft">O preparo só começa depois do pagamento.</p>
          )}
          <p className="mt-3 text-sm text-ink-soft">
            Pagamento: {order.payment.status ?? 'sem resposta do gateway ainda'}
            {order.payment.chargeId && ` · ${order.payment.chargeId}`}
          </p>
          {canCancel && (
            <Button variant="destructive" className="mt-4" onClick={() => setConfirmingCancel(true)}>
              Cancelar pedido
            </Button>
          )}
        </Section>
      </BusyRegion>

      {confirmingCancel && (
        <ConfirmDialog
          title={`Cancelar o pedido ${order.code}?`}
          confirmLabel="Cancelar pedido"
          pendingLabel="Cancelando..."
          isPending={cancel.isPending}
          error={cancel.error}
          onConfirm={confirmCancel}
          onCancel={() => {
            setConfirmingCancel(false);
            cancel.clearError();
          }}
        >
          {order.status === 'paid' ? (
            <p>
              Os itens voltam pro estoque. O estorno do pagamento é feito no painel do Pagar.me: este botão não
              devolve o dinheiro.
            </p>
          ) : (
            <p>O pedido ainda não foi pago. Os itens reservados voltam pra loja.</p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
