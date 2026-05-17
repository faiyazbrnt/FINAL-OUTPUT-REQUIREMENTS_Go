const DEFAULT_USD_TO_PHP_RATE = 56.5;

const normalizeExchangeRate = (rate: unknown): number => {
  const parsed = typeof rate === "number" ? rate : Number(rate);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_USD_TO_PHP_RATE;
  }

  return parsed;
};

export const getUsdToPhpRate = (): number => {
  return normalizeExchangeRate(import.meta.env.VITE_USD_TO_PHP_RATE);
};

export const convertUsdToPhp = (usdValue: number, exchangeRate = getUsdToPhpRate()): number => {
  return usdValue * exchangeRate;
};

export const formatPhpCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

