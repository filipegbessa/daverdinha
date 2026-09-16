import { readableTextColor } from './readable-text-color';

describe('readableTextColor', () => {
  it('uses white text on a dark colour', () => {
    expect(readableTextColor('#185928')).toBe('#ffffff');
    expect(readableTextColor('#000000')).toBe('#ffffff');
  });

  it('uses black text on a light colour', () => {
    expect(readableTextColor('#ffee88')).toBe('#000000');
    expect(readableTextColor('#ffffff')).toBe('#000000');
  });

  it('weighs green more heavily than blue, the way the eye does', () => {
    // Both are fully saturated primaries, but pure green reads as light and
    // pure blue as dark — a naive channel average would call them the same.
    expect(readableTextColor('#00ff00')).toBe('#000000');
    expect(readableTextColor('#0000ff')).toBe('#ffffff');
  });

  it('falls back to white rather than throwing on a malformed value', () => {
    expect(readableTextColor('nope')).toBe('#ffffff');
    expect(readableTextColor('#fff')).toBe('#ffffff');
  });
});
