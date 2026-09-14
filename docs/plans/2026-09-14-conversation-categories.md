# Conversation Categories (Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the attendant a full CRUD screen for categories, a way to tag/untag a conversation with any number of them, and a filter to find conversations by category — all with a curated color per category.

**Architecture:** A new `/admin/categorias` page (added to the nav) is a full CRUD list backed by `CategoryDialog` (create/edit) and a from-scratch delete-confirmation `Dialog` that states how many conversations the category is attached to (fetched already-populated on the list, no extra request). The conversation detail page renders every category as a clickable chip — filled when attached, outlined when not — toggling attach/detach immediately on click, the same immediate-effect pattern the page already uses for pause/reactivate. The conversation list page extends its existing client-side filtering `useMemo` with a category dropdown and adds a small colored-dot column.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Jest + React Testing Library.

**Spec:** No separate spec doc. Hard dependency: `daverdinha-api/docs/plans/2026-09-14-conversation-categories.md` must be fully implemented and deployed first — every task here calls endpoints that plan creates (`GET/POST/PATCH/DELETE /categories`, `POST/DELETE /conversations/:id/categories/:categoryId`, and `categories` on the `/conversations` and `/conversations/:id` responses).

## Global Constraints

- **No commit trailers:** no `Co-Authored-By:` / `Claude-Session:` line in any commit message.
- **Stage files by name:** `git add <file> <file>`, never `git add -A` or `git add .`.
- **Fixed color palette, not freeform input:** a category's color is always one of these exact 8 hex strings, presented as clickable swatches (radio-button semantics: exactly one selected). This mirrors the backend's `CATEGORY_COLORS` in `daverdinha-api/src/categories/category-colors.ts` — keep both lists byte-for-byte identical if either ever changes:

  ```typescript
  export const CATEGORY_COLORS = [
    '#185928',
    '#7a3247',
    '#a15c38',
    '#b8862c',
    '#2c6e6b',
    '#5b3a6b',
    '#3a5a7a',
    '#8a7f4f',
  ] as const;
  ```

- **Delete confirmation must state the exact affected count**, sourced from `conversationCount` already present on every item `GET /categories` returns — do not make a second request just to show the confirmation dialog.
- `useApiClient()` (`src/features/admin/lib/api-client.ts`) is the existing authenticated fetch wrapper — use it everywhere, don't hand-roll fetch calls.
- Test mocking convention used throughout `src/app/admin/**/*.test.tsx`: `jest.mock('@/features/admin/lib/api-client')` + `(useApiClient as jest.Mock).mockReturnValue({ apiFetch })`.
- Error text in this codebase's dialogs uses `text-berry` (see `MenuItemDialog.tsx`); page-level (non-dialog) error text uses `text-red-600` (see `conversas/page.tsx`, `conversas/[id]/page.tsx`) — match whichever pattern the surrounding file already uses, don't standardize on one across the whole plan.
- The honest loading/error pattern already established on `conversas/[id]/page.tsx` (a real "Carregando..." state, a real inline `role="alert"` error, error cleared at the start of each new attempt, a per-action boolean disabling only that action's button) must be followed for every new mutating action in this plan (category toggle, category delete).

---

## Task 1: Types and the color palette

**Files:**
- Create: `src/features/admin/lib/category-colors.ts`
- Create: `src/features/admin/lib/category-colors.test.ts`
- Modify: `src/features/admin/types/admin.ts`

**Interfaces:**
- Produces: `CATEGORY_COLORS: readonly string[]` (8 entries). `export interface Category { id: string; name: string; color: string; conversationCount?: number }`. `Conversation` gains `categories: Category[]`.

- [ ] **Step 1: Write the failing test**

`src/features/admin/lib/category-colors.test.ts`:

```typescript
import { CATEGORY_COLORS } from './category-colors';

describe('CATEGORY_COLORS', () => {
  it('has exactly 8 unique, valid hex colors', () => {
    expect(CATEGORY_COLORS).toHaveLength(8);
    expect(new Set(CATEGORY_COLORS).size).toBe(8);
    CATEGORY_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx jest src/features/admin/lib/category-colors.test.ts
```

Expected: FAIL — `Cannot find module './category-colors'`.

- [ ] **Step 3: Implement the palette**

`src/features/admin/lib/category-colors.ts`:

```typescript
export const CATEGORY_COLORS = [
  '#185928',
  '#7a3247',
  '#a15c38',
  '#b8862c',
  '#2c6e6b',
  '#5b3a6b',
  '#3a5a7a',
  '#8a7f4f',
] as const;
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx jest src/features/admin/lib/category-colors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add the types**

In `src/features/admin/types/admin.ts`, add near the other interfaces:

```typescript
export interface Category {
  id: string;
  name: string;
  color: string;
  conversationCount?: number;
}
```

Find the existing `Conversation` interface:

```typescript
export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: ConversationStatus;
  entryPoint: EntryPoint | null;
  unread: boolean;
  updatedAt: string;
}
```

and add a `categories` field:

```typescript
export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: ConversationStatus;
  entryPoint: EntryPoint | null;
  unread: boolean;
  updatedAt: string;
  categories: Category[];
}
```

`ConversationWithMessages` extends `Conversation`, so it picks up `categories` automatically — no change needed there.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors (adding a required field to `Conversation` may surface missing-field errors in test fixtures — fix any by adding `categories: []` to conversation fixtures in existing test files, e.g. `src/app/admin/conversas/page.test.tsx` and `src/app/admin/conversas/[id]/page.test.tsx`, wherever a conversation object literal is constructed).

- [ ] **Step 7: Full test run**

```bash
npx jest
```

Expected: every suite still passes.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/lib/category-colors.ts src/features/admin/lib/category-colors.test.ts src/features/admin/types/admin.ts
git commit -m "feat: add Category type and the shared color palette"
```

If Step 6 required fixing fixtures in other test files, stage those too by name in this same commit.

---

## Task 2: Categories CRUD screen

**Files:**
- Create: `src/features/admin/components/CategoryDialog.tsx`
- Create: `src/features/admin/components/CategoryDialog.test.tsx`
- Create: `src/app/admin/categorias/page.tsx`
- Create: `src/app/admin/categorias/page.test.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/layout.test.tsx`

**Interfaces:**
- Consumes: `useApiClient()` (`apiFetch`), `CATEGORY_COLORS` and `Category` (Task 1).
- Produces: `<CategoryDialog category={Category | null} onClose={() => void} onSaved={() => void} />`. Route `/admin/categorias`.

- [ ] **Step 1: Write the failing test for `CategoryDialog`**

`src/features/admin/components/CategoryDialog.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDialog } from './CategoryDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('CategoryDialog', () => {
  it('creates a new category with the first color selected by default', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bingo', color: '#185928' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('edits an existing category, pre-filling its name and color', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();
    const category = { id: 'cat1', name: 'Bingo', color: '#7a3247' };

    render(<CategoryDialog category={category} onClose={jest.fn()} onSaved={onSaved} />);

    expect(screen.getByLabelText('Nome')).toHaveValue('Bingo');
    await userEvent.click(screen.getByRole('radio', { name: '#a15c38' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories/cat1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Bingo', color: '#a15c38' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the error message and does not call onSaved when the API call fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe uma categoria com esse nome.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancelar is clicked', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });
    const onClose = jest.fn();

    render(<CategoryDialog category={null} onClose={onClose} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx jest src/features/admin/components/CategoryDialog.test.tsx
```

Expected: FAIL — `Cannot find module './CategoryDialog'`.

- [ ] **Step 3: Implement `CategoryDialog`**

`src/features/admin/components/CategoryDialog.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { CATEGORY_COLORS } from '@/features/admin/lib/category-colors';
import type { Category } from '@/features/admin/types/admin';

export function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { apiFetch } = useApiClient();
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (category) {
        await apiFetch(`/categories/${category.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, color }),
        });
      } else {
        await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name, color }) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="mb-1 block font-medium">
              Nome
            </label>
            <Input id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <span className="mb-1 block font-medium">Cor</span>
            <div role="radiogroup" aria-label="Cor da categoria" className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  role="radio"
                  aria-checked={color === swatch}
                  aria-label={swatch}
                  onClick={() => setColor(swatch)}
                  className={`h-8 w-8 rounded-full border-2 ${
                    color === swatch ? 'border-ink' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-berry">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx jest src/features/admin/components/CategoryDialog.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing test for the Categorias page**

`src/app/admin/categorias/page.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoriasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const categories = [
  { id: 'cat1', name: 'Bingo', color: '#185928', conversationCount: 3 },
  { id: 'cat2', name: 'Fechou compra', color: '#7a3247', conversationCount: 0 },
];

describe('CategoriasPage', () => {
  it('lists every category with its conversation count', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);

    expect(await screen.findByText('Bingo')).toBeInTheDocument();
    expect(screen.getByText('Fechou compra')).toBeInTheDocument();
    expect(screen.getByText('3 conversa(s)')).toBeInTheDocument();
    expect(screen.getByText('0 conversa(s)')).toBeInTheDocument();
  });

  it('opens the create dialog when "Nova categoria" is clicked', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    await screen.findByText('Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));

    expect(screen.getByRole('heading', { name: 'Nova categoria' })).toBeInTheDocument();
  });

  it('shows a delete-confirmation dialog stating the exact affected conversation count, and deletes on confirm', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    const [deleteBingoButton] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteBingoButton);

    expect(screen.getByText(/Essa categoria está em 3 conversa\(s\)/)).toBeInTheDocument();

    apiFetch.mockResolvedValueOnce(undefined).mockResolvedValueOnce([categories[1]]);
    // The dialog's own confirm button is labeled distinctly from the row's
    // "Excluir" button (which is still on screen behind the dialog), so
    // this selector is unambiguous.
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories/cat1', { method: 'DELETE' });
  });

  it('cancelling the delete dialog does not call the API', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    const [deleteBingoButton] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteBingoButton);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
```

Note the dialog's confirm button is labeled `'Confirmar exclusão'`, not `'Excluir'` — that's deliberate: the row's own "Excluir" button stays mounted behind the dialog while it's open, so reusing the same label would make `getByRole('button', { name: 'Excluir' })` ambiguous (two matches). The implementation in Step 7 already uses `'Confirmar exclusão'` for this reason.

- [ ] **Step 6: Run it to verify it fails**

```bash
npx jest src/app/admin/categorias/page.test.tsx
```

Expected: FAIL — `Cannot find module './page'`.

- [ ] **Step 7: Implement the page**

`src/app/admin/categorias/page.tsx`:

```typescript
'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApiClient } from '@/features/admin/lib/api-client';
import { CategoryDialog } from '@/features/admin/components/CategoryDialog';
import type { Category } from '@/features/admin/types/admin';

export default function CategoriasPage() {
  const { apiFetch } = useApiClient();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return apiFetch<Category[]>('/categories')
      .then((data) => {
        setCategories(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as categorias.');
      });
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmDelete() {
    if (!deleting) return;
    setError(null);
    setDeletingBusy(true);
    try {
      await apiFetch(`/categories/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria.');
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
      {!categories && !error && <p className="mt-6 text-ink-soft">Carregando...</p>}
      {categories && (
        <ul className="mt-6 space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 rounded-lg border border-sand-line p-3">
              <span
                className="h-4 w-4 flex-none rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span className="flex-1">{category.name}</span>
              <span className="text-sm text-ink-soft">{category.conversationCount ?? 0} conversa(s)</span>
              <Button variant="outline" onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleting(category)}>
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <Dialog open onOpenChange={(open) => !open && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir categoria &quot;{deleting.name}&quot;?</DialogTitle>
            </DialogHeader>
            <p>
              {deleting.conversationCount && deleting.conversationCount > 0
                ? `Essa categoria está em ${deleting.conversationCount} conversa(s). Excluir vai remover a marcação dessas conversas.`
                : 'Essa categoria não está em nenhuma conversa no momento.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletingBusy}>
                {deletingBusy ? 'Excluindo...' : 'Confirmar exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

```bash
npx jest src/app/admin/categorias/page.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 9: Add the nav item**

In `src/app/admin/layout.tsx`, find:

```typescript
const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/destaques', label: 'Destaques' },
  { href: '/admin/conversas', label: 'Conversas' },
];
```

and insert the new item between `Destaques` and `Conversas`:

```typescript
const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/destaques', label: 'Destaques' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/conversas', label: 'Conversas' },
];
```

- [ ] **Step 10: Update the layout test**

In `src/app/admin/layout.test.tsx`, add one line to the `renders links to every admin section` test, right after the `Destaques` assertion:

```typescript
    expect(screen.getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/admin/categorias');
```

- [ ] **Step 11: Full test run**

```bash
npx jest
npx tsc --noEmit
```

- [ ] **Step 12: Commit**

```bash
git add src/features/admin/components/CategoryDialog.tsx src/features/admin/components/CategoryDialog.test.tsx src/app/admin/categorias/page.tsx src/app/admin/categorias/page.test.tsx src/app/admin/layout.tsx src/app/admin/layout.test.tsx
git commit -m "feat: add categories CRUD screen with delete confirmation"
```

---

## Task 3: Tag/untag a conversation from its detail page

**Files:**
- Modify: `src/app/admin/conversas/[id]/page.tsx`
- Modify: `src/app/admin/conversas/[id]/page.test.tsx`

**Interfaces:**
- Consumes: `Category` (Task 1), `GET /categories`, `POST/DELETE /conversations/:id/categories/:categoryId`.

- [ ] **Step 1: Write the failing tests**

Add to `src/app/admin/conversas/[id]/page.test.tsx` (the file already mocks `useApiClient` and `next/navigation`'s `useParams` returning `{ id: 'c1' }` — reuse that setup; the existing `conversation` fixture needs a `categories: []` field added if Task 1's Step 6 didn't already add it here):

```typescript
  it('renders every category as a chip, filled for attached ones and outlined for the rest', async () => {
    const allCategories = [
      { id: 'cat1', name: 'Bingo', color: '#185928' },
      { id: 'cat2', name: 'Fechou compra', color: '#7a3247' },
    ];
    const apiFetch = jest.fn((path: string) => {
      if (path === '/categories') return Promise.resolve(allCategories);
      return Promise.resolve({ ...conversation, categories: [allCategories[0]] });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    const bingoChip = await screen.findByRole('button', { name: 'Bingo' });
    const fechouChip = screen.getByRole('button', { name: 'Fechou compra' });
    expect(bingoChip).toHaveStyle({ backgroundColor: '#185928' });
    expect(fechouChip).not.toHaveStyle({ backgroundColor: '#7a3247' });
  });

  it('attaches a category when its chip is clicked while detached', async () => {
    const allCategories = [{ id: 'cat1', name: 'Bingo', color: '#185928' }];
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path === '/categories') return Promise.resolve(allCategories);
      if (options?.method === 'POST' && path === '/conversations/c1/categories/cat1') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ ...conversation, categories: [] });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const chip = await screen.findByRole('button', { name: 'Bingo' });
    await userEvent.click(chip);

    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/categories/cat1', { method: 'POST' });
  });

  it('detaches a category when its chip is clicked while attached', async () => {
    const allCategories = [{ id: 'cat1', name: 'Bingo', color: '#185928' }];
    const apiFetch = jest.fn((path: string, options?: RequestInit) => {
      if (path === '/categories') return Promise.resolve(allCategories);
      if (options?.method === 'DELETE' && path === '/conversations/c1/categories/cat1') {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ ...conversation, categories: allCategories });
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);
    const chip = await screen.findByRole('button', { name: 'Bingo' });
    await userEvent.click(chip);

    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/categories/cat1', { method: 'DELETE' });
  });
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx jest src/app/admin/conversas/\[id\]/page.test.tsx
```

Expected: FAIL — no chips render (nothing fetches `/categories` yet).

- [ ] **Step 3: Add the chip-toggle UI**

In `src/app/admin/conversas/[id]/page.tsx`, add the import:

```typescript
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import type { Category } from '@/features/admin/types/admin';
```

(`useApiResource` is likely already imported for the main conversation resource — don't duplicate the import line, just add the `Category` type import if it's missing.)

Add a second `useApiResource` call alongside the existing one, and a `togglingCategoryId` state, near the other `useState` declarations:

```typescript
  const { data: allCategories } = useApiResource<Category[]>('/categories');
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
```

Add the toggle handler near `handlePause`/`handleReactivate`:

```typescript
  async function handleToggleCategory(categoryId: string, attached: boolean) {
    setActionError(null);
    setTogglingCategoryId(categoryId);
    try {
      await apiFetch(`/conversations/${id}/categories/${categoryId}`, {
        method: attached ? 'DELETE' : 'POST',
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar categoria.');
    } finally {
      setTogglingCategoryId(null);
    }
  }
```

Render the chips — place this block right after the header/contact-info section and before the messages list (find the `<div ref={messagesRef} ...>` that renders the message list, and insert immediately before it):

```tsx
      {allCategories && allCategories.length > 0 && (
        <div className="flex flex-none flex-wrap gap-2 border-b border-sand-line py-3">
          {allCategories.map((cat) => {
            const attached = conversation.categories.some((c) => c.id === cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id, attached)}
                disabled={togglingCategoryId === cat.id}
                className="rounded-full border-2 px-3 py-1 text-sm font-medium"
                style={
                  attached
                    ? { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' }
                    : { borderColor: cat.color, color: cat.color, backgroundColor: 'transparent' }
                }
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx jest src/app/admin/conversas/\[id\]/page.test.tsx
```

Expected: PASS, including every pre-existing test in the file.

- [ ] **Step 5: Full test run**

```bash
npx jest
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/conversas/\[id\]/page.tsx src/app/admin/conversas/\[id\]/page.test.tsx
git commit -m "feat: tag/untag a conversation with categories from its detail page"
```

---

## Task 4: Filter and show categories on the conversation list

**Files:**
- Modify: `src/app/admin/conversas/page.tsx`
- Modify: `src/app/admin/conversas/page.test.tsx`

**Interfaces:**
- Consumes: `Category` (Task 1), `GET /categories`, `conversation.categories` (already present on every item `GET /conversations` returns, per the API plan's Task 3).

- [ ] **Step 1: Write the failing tests**

Add to `src/app/admin/conversas/page.test.tsx` (the existing fixtures for conversations need a `categories: []` array if Task 1's Step 6 fixup didn't already add it in this file):

```typescript
  it('shows a colored dot per attached category in a new column', async () => {
    const apiFetch = jest.fn((path: string) => {
      if (path === '/categories') return Promise.resolve([{ id: 'cat1', name: 'Bingo', color: '#185928' }]);
      return Promise.resolve([
        { id: '1', phone: '5521999999999', name: 'Maria', status: 'bot_active', entryPoint: 'menu', unread: false, updatedAt: '2026-01-01T00:00:00Z', categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] },
      ]);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    (useApiResource as jest.Mock).mockReturnValue({
      data: [{ id: '1', phone: '5521999999999', name: 'Maria', status: 'bot_active', entryPoint: 'menu', unread: false, updatedAt: '2026-01-01T00:00:00Z', categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] }],
      isLoading: false,
      error: null,
    });

    render(<ConversasPage />);

    expect(await screen.findByTitle('Bingo')).toHaveStyle({ backgroundColor: '#185928' });
  });

  it('filters the list down to conversations with the selected category', async () => {
    (useApiClient as jest.Mock).mockReturnValue({
      apiFetch: jest.fn().mockResolvedValue([{ id: 'cat1', name: 'Bingo', color: '#185928' }]),
    });
    (useApiResource as jest.Mock).mockReturnValue({
      data: [
        { id: '1', phone: '5521999999999', name: 'Maria', status: 'bot_active', entryPoint: 'menu', unread: false, updatedAt: '2026-01-01T00:00:00Z', categories: [{ id: 'cat1', name: 'Bingo', color: '#185928' }] },
        { id: '2', phone: '5521988888888', name: 'João', status: 'bot_active', entryPoint: 'menu', unread: false, updatedAt: '2026-01-01T00:00:00Z', categories: [] },
      ],
      isLoading: false,
      error: null,
    });

    render(<ConversasPage />);
    await screen.findByText('Maria');
    expect(screen.getByText('João')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por categoria'), 'cat1');

    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.queryByText('João')).not.toBeInTheDocument();
  });
```

This page's existing tests mock `useApiResource` directly (check the top of `page.test.tsx` for the existing `jest.mock('@/features/admin/lib/use-api-resource')` — if it isn't already mocked that way, add `jest.mock('@/features/admin/lib/use-api-resource');` and `import { useApiResource } from '@/features/admin/lib/use-api-resource';` at the top, matching whatever pattern the file's pre-existing tests already use for supplying `data`/`isLoading`/`error`). Also add `jest.mock('@/features/admin/lib/api-client');` and the `useApiClient` import if the file doesn't already have them (this page currently doesn't call `useApiClient` at all — Task 4 introduces the first use of it here, to fetch `/categories`).

- [ ] **Step 2: Run it to verify it fails**

```bash
npx jest src/app/admin/conversas/page.test.tsx
```

Expected: FAIL — no categories column, no filter control.

- [ ] **Step 3: Implement the filter and column**

In `src/app/admin/conversas/page.tsx`, add the imports:

```typescript
import { useApiClient } from '@/features/admin/lib/api-client';
import type { Category } from '@/features/admin/types/admin';
```

Add state and a fetch for the category list, plus the filter, near the top of the component body:

```typescript
  const { apiFetch } = useApiClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    apiFetch<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [apiFetch]);
```

(Add `useEffect` to the existing `import { useMemo, useState } from 'react';` line, making it `import { useEffect, useMemo, useState } from 'react';`.)

Extend the existing `filtered` `useMemo` — find:

```typescript
  const filtered = useMemo(() => {
    const query = normalizeSearch(search.trim());
    return conversations.filter((conversation) => {
      if (onlyUnread && !conversation.unread) return false;
      if (!query) return true;
      const haystack = `${normalizeSearch(conversation.name ?? '')} ${conversation.phone}`;
      return haystack.includes(query);
    });
  }, [conversations, search, onlyUnread]);
```

and change it to:

```typescript
  const filtered = useMemo(() => {
    const query = normalizeSearch(search.trim());
    return conversations.filter((conversation) => {
      if (onlyUnread && !conversation.unread) return false;
      if (categoryFilter !== 'all' && !conversation.categories.some((c) => c.id === categoryFilter)) {
        return false;
      }
      if (!query) return true;
      const haystack = `${normalizeSearch(conversation.name ?? '')} ${conversation.phone}`;
      return haystack.includes(query);
    });
  }, [conversations, search, onlyUnread, categoryFilter]);
```

Add the `<select>` filter control next to the existing "Não lidas" button, inside the `<div className="flex flex-wrap items-center gap-2">` wrapper:

```tsx
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoria"
            className="rounded-md border border-sand-line bg-paper px-2 py-1.5 text-sm"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
```

Add the new table column — in `TableHeader`, after the existing `<TableHead>Origem</TableHead>`:

```tsx
              <TableHead>Categorias</TableHead>
```

And in the row rendering, after the existing `<TableCell>{conversation.entryPoint ? ENTRY_POINT_LABEL[conversation.entryPoint] : '—'}</TableCell>`:

```tsx
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {conversation.categories.map((cat) => (
                      <span
                        key={cat.id}
                        title={cat.name}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    ))}
                  </div>
                </TableCell>
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx jest src/app/admin/conversas/page.test.tsx
```

Expected: PASS, including every pre-existing test in the file.

- [ ] **Step 5: Full test run**

```bash
npx jest
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/conversas/page.tsx src/app/admin/conversas/page.test.tsx
git commit -m "feat: filter and display categories on the conversations list"
```

---

## After this plan ships

Manually verify end to end: create 2-3 categories with different colors on `/admin/categorias`, tag a real conversation with more than one, confirm the colored dots show up on the list and the filter narrows it down, then delete a category that's attached to a conversation and confirm the dialog states the right count and the conversation loses the tag afterward without anything else breaking.
