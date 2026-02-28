import { API_URL } from './constants';

export async function fetchPrice(sizeBytes: number): Promise<number | null> {
  if (sizeBytes <= 0) {
    return 0;
  }

  try {
    const response = await fetch(`${API_URL}/api/price?size=${sizeBytes}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return typeof data.priceUsd === 'number' ? data.priceUsd : null;
  } catch (error) {
    console.warn('Failed to fetch price:', error);
    return null;
  }
}

export function formatPrice(price: number | null): string {
  if (price === null) {
    return '—';
  }

  return `$${price.toFixed(2)} USD`;
}
