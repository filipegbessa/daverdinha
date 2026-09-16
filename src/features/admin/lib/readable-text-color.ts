/**
 * Picks black or white for text sitting on `backgroundColor`, so a category
 * chip stays readable whatever the operator picked out of the colour input —
 * hardcoding white broke the moment someone chose a pale yellow.
 *
 * Uses the WCAG relative-luminance threshold rather than a naive average:
 * the eye is far more sensitive to green than to blue, and averaging reads
 * pure blue as "light" when it is not.
 */
export function readableTextColor(backgroundColor: string): '#000000' | '#ffffff' {
  const hex = backgroundColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';

  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? '#000000' : '#ffffff';
}
