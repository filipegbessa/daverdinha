import { normalizeSearch } from './normalize-search';

describe('normalizeSearch', () => {
  it('ignores accents, case and surrounding spaces', () => {
    expect(normalizeSearch('  Mudas Rústicas ')).toBe('mudas rusticas');
    expect(normalizeSearch('mudas rusticas')).toBe(normalizeSearch('MUDAS RÚSTICAS'));
  });
});
