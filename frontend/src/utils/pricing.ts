const BASE_PRICE_USD = 0.01;
const TURBO_COST_PER_MIB = 0.01;
const MARKUP_MULTIPLIER = 1.25;

export function calculatePrice(sizeBytes: number): number {
  const sizeMiB = sizeBytes / (1024 * 1024);
  const userPrice = Math.max(BASE_PRICE_USD, sizeMiB * TURBO_COST_PER_MIB * MARKUP_MULTIPLIER);
  return Math.round(userPrice * 100) / 100;
}

export function formatPrice(price: number | null): string {
  return `$${price !== null ? price.toFixed(2) : '0.01'} USD`;
}