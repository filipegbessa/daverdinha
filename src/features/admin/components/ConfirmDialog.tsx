'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErrorText } from '@/features/admin/components/StatusMessage';

/**
 * The confirm-before-destroying dialog. Categories had one; the menu page
 * deleted items on a single click with no confirmation at all — same kind of
 * irreversible action, two different levels of care.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Confirmar exclusão',
  pendingLabel = 'Excluindo...',
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
