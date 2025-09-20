import { config } from '../config';

export const formatCurrency = (
  amount: number,
  currencyCode: string = config.DEFAULT_CURRENCY
): string => {
  const currency = config.SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '$';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (
  date: string | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };
  
  return new Intl.DateTimeFormat('en-US', options[format]).format(dateObj);
};

export const formatNumber = (
  num: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', options).format(num);
};