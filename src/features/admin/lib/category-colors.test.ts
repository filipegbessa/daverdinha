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
