import { showNotification } from '../../src/utils/showNotification.js';

describe('showNotification', () => {
  test('Debe aceptar mensaje de éxito', () => {
    expect(() => {
      showNotification('Operación completada', 'success');
    }).not.toThrow();
  });

  test('Debe aceptar mensaje de error', () => {
    expect(() => {
      showNotification('Error en la operación', 'error');
    }).not.toThrow();
  });

  test('Debe aceptar mensaje de advertencia', () => {
    expect(() => {
      showNotification('Advertencia importante', 'warning');
    }).not.toThrow();
  });

  test('Debe aceptar mensaje de información', () => {
    expect(() => {
      showNotification('Información útil', 'info');
    }).not.toThrow();
  });

  test('Debe aceptar solo message (tipo por defecto)', () => {
    expect(() => {
      showNotification('Solo mensaje');
    }).not.toThrow();
  });

  test('Debe aceptar opciones de duración', () => {
    expect(() => {
      showNotification('Mensaje', 'info', { duration: 5000 });
    }).not.toThrow();
  });
});
