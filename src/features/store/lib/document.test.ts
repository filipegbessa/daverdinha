import { formatDocument, parseDocument } from './document';

describe('parseDocument', () => {
  it('accepts a valid CPF, with or without mask, and returns only digits', () => {
    expect(parseDocument('111.444.777-35')).toEqual({ type: 'CPF', value: '11144477735' });
    expect(parseDocument('11144477735')).toEqual({ type: 'CPF', value: '11144477735' });
  });

  it('rejects a CPF with a wrong check digit', () => {
    expect(parseDocument('11144477736')).toBeNull();
  });

  it('rejects a CPF with all the same digit', () => {
    expect(parseDocument('11111111111')).toBeNull();
  });

  it('accepts a valid CNPJ, with or without mask, and returns only digits', () => {
    expect(parseDocument('11.222.333/0001-81')).toEqual({ type: 'CNPJ', value: '11222333000181' });
    expect(parseDocument('11222333000181')).toEqual({ type: 'CNPJ', value: '11222333000181' });
  });

  it('rejects a CNPJ with a wrong check digit', () => {
    expect(parseDocument('11222333000180')).toBeNull();
  });

  it('accepts an alphanumeric passport, uppercased and without separators', () => {
    expect(parseDocument('ab 123456')).toEqual({ type: 'PASSPORT', value: 'AB123456' });
  });

  it('rejects a passport shorter than 5 characters', () => {
    expect(parseDocument('AB12')).toBeNull();
  });

  it('rejects a number with the wrong length for a CPF or CNPJ, instead of falling back to passport', () => {
    expect(parseDocument('12312')).toBeNull();
    expect(parseDocument('123456789')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(parseDocument('')).toBeNull();
    expect(parseDocument('   ')).toBeNull();
  });
});

describe('formatDocument', () => {
  it('masks 11 digits as a CPF', () => {
    expect(formatDocument('11144477735')).toBe('111.444.777-35');
  });

  it('masks 14 digits as a CNPJ', () => {
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('leaves a passport (or anything else) untouched', () => {
    expect(formatDocument('AB123456')).toBe('AB123456');
  });

  it('leaves an incomplete number untouched, so the person can keep typing', () => {
    expect(formatDocument('111444777')).toBe('111444777');
  });
});
