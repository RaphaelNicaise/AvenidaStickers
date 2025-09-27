export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implementar una notificación toast real más adelante
  if (type === 'error') {
    console.error(message);
  }
};