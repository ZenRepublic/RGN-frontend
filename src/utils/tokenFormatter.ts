export function formatTokenBalance(balance: number): string {
  if (balance >= 1000000) {
    return (balance / 1000000).toFixed(2) + 'M';
  }
  if (balance >= 1000) {
    return (balance / 1000).toFixed(2) + 'K';
  }
  return balance.toString();
}
