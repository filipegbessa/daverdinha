import { heroSlideStatus } from './hero-slide-status';

const now = new Date('2026-11-18T15:00:00.000Z');
const base = { active: true, live: true, startsAt: null, endsAt: null };

describe('heroSlideStatus', () => {
  it('says whether the slide is on the home now, and why not', () => {
    expect(heroSlideStatus(base, now)).toBe('Na home');
    expect(heroSlideStatus({ ...base, active: false }, now)).toBe('Desligado');
    expect(heroSlideStatus({ ...base, startsAt: '2026-11-20T13:00:00.000Z' }, now)).toMatch(/^Começa em /);
    expect(heroSlideStatus({ ...base, endsAt: '2026-11-17T13:00:00.000Z' }, now)).toMatch(/^Terminou em /);
    expect(heroSlideStatus({ ...base, endsAt: '2026-11-30T13:00:00.000Z' }, now)).toMatch(/^Na home até /);
  });
});
