export type TaxRate = {
  label: string;
  rate: number;
};

type CountryTaxEntry = { kind: 'flat'; rate: TaxRate } | { kind: 'by-state'; states: Record<string, TaxRate> };

const COUNTRY_TAX_TABLE: Record<string, CountryTaxEntry> = {
  IN: { kind: 'flat', rate: { label: 'GST - India', rate: 0.18 } },
  GB: { kind: 'flat', rate: { label: 'VAT - United Kingdom', rate: 0.2 } },
  US: {
    kind: 'by-state',
    states: {
      CA: { label: 'Sales Tax - California', rate: 0.0725 },
      NY: { label: 'Sales Tax - New York', rate: 0.04 },
      TX: { label: 'Sales Tax - Texas', rate: 0.0625 },
    },
  },
};

export function lookupTaxRate(countryCode: string, stateCode?: string | null): TaxRate | null {
  const entry = COUNTRY_TAX_TABLE[countryCode.toUpperCase()];
  if (!entry) {
    return null;
  }
  if (entry.kind === 'flat') {
    return entry.rate;
  }
  if (!stateCode) {
    return null;
  }
  return entry.states[stateCode.toUpperCase()] ?? null;
}
