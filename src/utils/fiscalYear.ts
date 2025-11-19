const FISCAL_START_MONTH = 3; // April (0-indexed)

export interface FiscalYearRange {
  label: string;
  start: Date;
  end: Date;
}

const buildLabel = (startYear: number) =>
  `FY ${startYear}-${(startYear + 1).toString().slice(-2)}`;

export const getFiscalYearRangeForDate = (date: Date): FiscalYearRange => {
  const year = date.getFullYear();
  const fiscalStart =
    date.getMonth() >= FISCAL_START_MONTH
      ? new Date(year, FISCAL_START_MONTH, 1, 0, 0, 0, 0)
      : new Date(year - 1, FISCAL_START_MONTH, 1, 0, 0, 0, 0);

  const fiscalEnd = new Date(
    fiscalStart.getFullYear() + 1,
    FISCAL_START_MONTH,
    0,
    23,
    59,
    59,
    999
  );

  return {
    label: buildLabel(fiscalStart.getFullYear()),
    start: fiscalStart,
    end: fiscalEnd,
  };
};

export const getCurrentFiscalYearRange = (): FiscalYearRange =>
  getFiscalYearRangeForDate(new Date());

