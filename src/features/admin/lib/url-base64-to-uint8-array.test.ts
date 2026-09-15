import { urlBase64ToUint8Array } from './url-base64-to-uint8-array';

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string into the matching byte array', () => {
    // "AB~-_" as base64url maps to the raw bytes below — this fixture
    // exercises both the "-"/"+" and "_"/"/" substitutions.
    const result = urlBase64ToUint8Array('AA-_');
    expect(Array.from(result)).toEqual([0, 15, 191]);
  });

  it('returns an empty array for an empty string', () => {
    expect(Array.from(urlBase64ToUint8Array(''))).toEqual([]);
  });
});
