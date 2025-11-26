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
  const locale = getLocale();
  console.log(locale, getCurrencyForLocale(locale));
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: getCurrencyForLocale(locale),
  }).format(value);
};

export const formatNumber = (value: number) => new Intl.NumberFormat(getLocale()).format(value);
