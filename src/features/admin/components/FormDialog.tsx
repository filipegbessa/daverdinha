'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ErrorText } from '@/features/admin/components/StatusMessage';

/**
 * The create/edit dialog shell: title, form, "Cancelar"/"Salvar" footer with
 * the pending state, and the API error above the buttons. Each dialog only
 * brings its fields and its submit; none of them re-implements the footer or
 * forgets the spinner.
 *
 * Header (title + close) and footer stay put and only the fields scroll, so a
 * long form (produto, with photos) never hides "Salvar" or the error.
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
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b py-4 pr-12 pl-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div data-slot="form-dialog-body" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {children}
          </div>
          <div className="shrink-0 space-y-2 rounded-b-xl border-t bg-muted/50 p-4">
            {error && <ErrorText>{error}</ErrorText>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={isPending} loadingText="Salvando...">
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
