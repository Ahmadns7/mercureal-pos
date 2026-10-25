export function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-NG')
}
