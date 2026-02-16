// apps/api/src/services/multiCurrency.js

const axios = require("axios");

class MultiCurrencyService {
  /**
   * Multi-currency support with real-time exchange rates
   */

  constructor() {
    this.supportedCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "NZD",
      "CHF",
      "CNY",
      "INR",
    ];
    this.rateCache = {};
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get current exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    const cacheKey = `${fromCurrency}:${toCurrency}`;

    // Check cache
    if (this.rateCache[cacheKey] && this.rateCache[cacheKey].expires > Date.now()) {
      return this.rateCache[cacheKey].rate;
    }

    try {
      // Fetch from external API (using fixer.io or similar)
      const response = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/" + fromCurrency,
      );
      const rate = response.data.rates[toCurrency];

      // Cache the rate
      this.rateCache[cacheKey] = {
        rate,
        expires: Date.now() + this.cacheExpiry,
      };

      return rate;
    } catch (error) {
      console.error("Failed to get exchange rate:", error);
      // Return cached rate if available
      return this.rateCache[cacheKey]?.rate || 1;
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: parseFloat((amount * rate).toFixed(2)),
      convertedCurrency: toCurrency,
      rate: parseFloat(rate.toFixed(6)),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate pricing in different currencies
   */
  async getPricingInCurrency(basePrice, targetCurrency) {
    const rates = {};

    for (const currency of this.supportedCurrencies) {
      if (currency !== "USD") {
        const rate = await this.getExchangeRate("USD", currency);
        rates[currency] = parseFloat((basePrice * rate).toFixed(2));
      }
    }

    rates["USD"] = basePrice;

    return {
      basePrice,
      baseCurrency: "USD",
      pricesByCurrency: rates,
      targetPrice: rates[targetCurrency],
      targetCurrency,
    };
  }

  /**
   * Format amount with currency symbol
   */
  formatCurrency(amount, currency) {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      NZD: "NZ$",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹",
    };

    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Get currency information
   */
  getCurrencyInfo(currency) {
    const info = {
      USD: { name: "US Dollar", symbol: "$", decimals: 2 },
      EUR: { name: "Euro", symbol: "€", decimals: 2 },
      GBP: { name: "British Pound", symbol: "£", decimals: 2 },
      JPY: { name: "Japanese Yen", symbol: "¥", decimals: 0 },
      CAD: { name: "Canadian Dollar", symbol: "C$", decimals: 2 },
      AUD: { name: "Australian Dollar", symbol: "A$", decimals: 2 },
    };

    return info[currency] || { name: currency, symbol: currency, decimals: 2 };
  }
}

module.exports = { MultiCurrencyService };
