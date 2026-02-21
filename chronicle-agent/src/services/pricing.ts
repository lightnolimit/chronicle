import axios from 'axios';
import type { PricingInfo } from '../types/index.js';

const TURBO_PRICING_API = 'https://ardrive.net/price';
const MARKUP_PERCENT = 10;
const BASE_PRICE_USD = 0.01;

export class PricingService {
  private cache: Map<number, PricingInfo> = new Map();
  private cacheTimeout = 5 * 60 * 1000;
  private cacheTimestamp: number = 0;

  async getPrice(bytes: number): Promise<PricingInfo> {
    const cached = this.cache.get(bytes);
    const now = Date.now();

    if (cached && now - this.cacheTimestamp < this.cacheTimeout) {
      return cached;
    }

    try {
      const response = await axios.get(`${TURBO_PRICING_API}/${bytes}`);
      const winc = parseInt(response.data, 10);
      const turboCostUsd = winc / 1e12;

      const userPriceUsd = Math.max(
        BASE_PRICE_USD,
        turboCostUsd * (1 + MARKUP_PERCENT / 100)
      );

      const pricing: PricingInfo = {
        bytes,
        turboCostUsd,
        userPriceUsd: Math.round(userPriceUsd * 100) / 100,
        markupPercent: MARKUP_PERCENT,
      };

      this.cache.set(bytes, pricing);
      this.cacheTimestamp = now;

      return pricing;
    } catch (error) {
      const fallbackPrice = Math.max(
        BASE_PRICE_USD,
        (bytes / 1024) * 0.001 * (1 + MARKUP_PERCENT / 100)
      );

      return {
        bytes,
        turboCostUsd: (bytes / 1024) * 0.001,
        userPriceUsd: Math.round(fallbackPrice * 100) / 100,
        markupPercent: MARKUP_PERCENT,
      };
    }
  }

  async getMinimumPrice(): Promise<PricingInfo> {
    return this.getPrice(0);
  }
}

export const pricingService = new PricingService();