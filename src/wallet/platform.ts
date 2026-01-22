export function isSaga(): boolean {
  // Most reliable in practice
  return /Saga|Android/i.test(navigator.userAgent);
}