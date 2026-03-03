const getLocale = () => (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

const getCurrencyForLocale = (locale: string) => {
  // Map locale to currency - Intl.NumberFormat will use the correct currency for the locale
  const regionCurrency: Record<string, string> = {
    US: 'USD',
    GB: 'GBP',
    AU: 'AUD',
    CA: 'CAD',
    NZ: 'NZD',
    BR: 'BRL',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
    PT: 'EUR',
    JP: 'JPY',
    CN: 'CNY',
    KR: 'KRW',
    IN: 'INR',
    MX: 'MXN',
    CH: 'CHF',
    SE: 'SEK',
    NO: 'NOK',
    DK: 'DKK',
    PL: 'PLN',
    ZA: 'ZAR',
    SG: 'SGD',
    HK: 'HKD',
  };
  const region = locale.split('-')[1]?.toUpperCase();
  return regionCurrency[region] || 'USD';
};

export const formatCurrency = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: getCurrencyForLocale(locale),
  }).format(safeValue);
};

export const formatNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(getLocale()).format(safeValue);
};
