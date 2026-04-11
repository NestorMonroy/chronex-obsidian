import { bytesToHex, hexToBytes } from '../../src/utils/helpers/hexEncoder.js';

describe('hexEncoder helpers', () => {
  describe('bytesToHex', () => {
    test('Debe convertir bytes a hex', () => {
      const bytes = new Uint8Array([255, 0, 127]);
      expect(bytesToHex(bytes)).toBe('ff007f');
    });
    test('Debe manejar bytes vacío', () => {
      expect(bytesToHex(new Uint8Array())).toBe('');
    });
    test('Debe mantener padding con ceros', () => {
      const bytes = new Uint8Array([1, 2, 15]);
      expect(bytesToHex(bytes)).toBe('01020f');
    });
  });

  describe('hexToBytes', () => {
    test('Debe convertir hex a bytes', () => {
      const result = hexToBytes('ff007f');
      expect(result).toEqual([255, 0, 127]);
    });
    test('Debe manejar hex vacío', () => {
      expect(hexToBytes('')).toEqual([]);
    });
  });

  describe('Round-trip conversion', () => {
    test('Debe mantener integridad en conversión bidireccional', () => {
      const original = new Uint8Array([100, 50, 200, 15]);
      const hex = bytesToHex(original);
      const recovered = new Uint8Array(hexToBytes(hex));
      expect(recovered).toEqual(original);
    });
  });
});
