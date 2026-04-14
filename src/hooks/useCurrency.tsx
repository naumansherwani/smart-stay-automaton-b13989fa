import { useState, useEffect, useCallback } from "react";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to USD
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.88 },
  { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar", rate: 0.31 },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", rate: 278.50 },
];

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem("preferred_currency") || "USD";
  });

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem("preferred_currency", code);
  }, []);

  const convert = useCallback((amountUSD: number) => {
    return amountUSD * selectedCurrency.rate;
  }, [selectedCurrency]);

  const format = useCallback((amountUSD: number) => {
    const converted = convert(amountUSD);
    return `${selectedCurrency.symbol}${converted.toFixed(2)}`;
  }, [convert, selectedCurrency]);

  return { currency, setCurrency, selectedCurrency, convert, format, CURRENCIES };
}
