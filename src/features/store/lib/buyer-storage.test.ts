import { BUYER_STORAGE_KEY, clearBuyer, readBuyer, saveBuyer } from './buyer-storage';

describe('buyer-storage', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(readBuyer()).toBeNull();
  });

  it('saves and reads the buyer back', () => {
    saveBuyer({
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      phone: '(21) 99999-8888',
      cep: '22220-000',
      number: '100',
      complement: 'apto 2',
    });
    expect(readBuyer()).toEqual({
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      phone: '(21) 99999-8888',
      cep: '22220-000',
      number: '100',
      complement: 'apto 2',
    });
  });

  it('keeps the saved address when a ticket purchase saves only the contact', () => {
    saveBuyer({
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      phone: '21',
      cep: '22220-000',
      number: '100',
      complement: '',
    });
    saveBuyer({ name: 'Maria Lima', email: 'maria@exemplo.com', phone: '21' });
    expect(readBuyer()).toMatchObject({ name: 'Maria Lima', cep: '22220-000', number: '100' });
  });

  it('never stores anything but the known fields', () => {
    saveBuyer({ name: 'Maria Souza', document: '11144477735' } as never);
    expect(localStorage.getItem(BUYER_STORAGE_KEY)).not.toContain('11144477735');
  });

  it('ignores broken data', () => {
    localStorage.setItem(BUYER_STORAGE_KEY, '{nope');
    expect(readBuyer()).toBeNull();
    localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify({ name: 3 }));
    expect(readBuyer()).toBeNull();
  });

  it('clears', () => {
    saveBuyer({ name: 'Maria Souza' });
    clearBuyer();
    expect(readBuyer()).toBeNull();
  });
});
