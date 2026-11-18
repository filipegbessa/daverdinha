'use client';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { HeroSlideForm } from '@/features/admin/components/HeroSlideForm';

/** Novo destaque: entra no fim da fila da home. */
export default function NovoDestaquePage() {
  const router = useRouter();
  return (
    <div>
      <BackLink href="/admin/destaques">Voltar para destaques</BackLink>
      <PageHeader title="Novo destaque" />
      <p className="mt-2 text-sm text-muted-foreground">Entra por último na ordem; mude a ordem na lista.</p>
      <div className="mt-6">
        <HeroSlideForm slide={null} onSaved={(created) => router.push(`/admin/destaques/${created.id}?criado=1`)} />
      </div>
    </div>
  );
}
