/**
 * Módulo Helper: Codificación hexadecimal
 * Centraliza conversión de bytes a hexadecimal
 * 
 * @module src/utils/helpers/hexEncoder
 * @version 1.0.0
 * @author Nestor
 * @date 2026-04-11
 */

export function bytesToHex(bytes) {
  if (!bytes || bytes.length === 0) {
    return '';
  }
  
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
