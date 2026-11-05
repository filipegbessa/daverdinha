'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ErrorText } from '@/features/admin/components/StatusMessage';

/**
 * The create/edit dialog shell: title, form, "Cancelar"/"Salvar" footer with
 * the pending state, and the API error under it. Each dialog only brings its
 * fields and its submit; none of them re-implements the footer or forgets the
 * spinner.
 */
export function FormDialog({
  title,
  onClose,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Salvar',
  children,
}: {
  title: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string | null;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} loadingText="Salvando...">
              {submitLabel}
            </Button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
