import { useState, useEffect, useCallback } from "react";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to GBP base
}

export const CURRENCIES: CurrencyOption[] = [
  // GBP is the master base currency. All rates are relative to 1 GBP.
  { code: "GBP", symbol: "£", name: "British Pound", rate: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.27 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 1.17 },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc", rate: 1.12 },
  { code: "KWD", symbol: "KWD ", name: "Kuwaiti Dinar", rate: 0.39 },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", rate: 354 },
];

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem("preferred_currency") || "GBP";
  });

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem("preferred_currency", code);
  }, []);

  // amount is in GBP (master base currency)
  const convert = useCallback((amountGBP: number) => {
    return amountGBP * selectedCurrency.rate;
  }, [selectedCurrency]);

  const format = useCallback((amountGBP: number) => {
    const converted = convert(amountGBP);
    const decimals = selectedCurrency.code === "PKR" || selectedCurrency.code === "KWD" ? 0 : 2;
    return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }, [convert, selectedCurrency]);

  return { currency, setCurrency, selectedCurrency, convert, format, CURRENCIES };
}
