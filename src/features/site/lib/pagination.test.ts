import { paginate } from './pagination';

const items = Array.from({ length: 45 }, (_, i) => i);

describe('paginate', () => {
  it('defaults to page 1, 20 items', () => {
    const result = paginate(items, undefined);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.items).toEqual(items.slice(0, 20));
  });

  it('slices the requested page', () => {
    const result = paginate(items, '2');
    expect(result.page).toBe(2);
    expect(result.items).toEqual(items.slice(20, 40));
  });

  it('clamps a page past the end to the last page', () => {
    const result = paginate(items, '99');
    expect(result.page).toBe(3);
    expect(result.items).toEqual(items.slice(40, 45));
  });

  it('clamps an invalid or non-positive page to 1', () => {
    expect(paginate(items, '0').page).toBe(1);
    expect(paginate(items, '-5').page).toBe(1);
    expect(paginate(items, 'abc').page).toBe(1);
  });

  it('is always a single page when there are 20 or fewer items', () => {
    const few = items.slice(0, 8);
    const result = paginate(few, '1');
    expect(result.totalPages).toBe(1);
    expect(result.items).toEqual(few);
  });
});
