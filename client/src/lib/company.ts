import type { BillCompany } from '../api/bills';

/** HK Trading — app shell + printed invoice (overridable via server BILL_COMPANY_* env on Railway). */
export const HK_APP = {
  shortName: 'HK Trading',
  legalName: 'HK TRADING HOUSE',
  appTitle: 'HK Trading Admin',
  tagline: 'Device inventory · Customers · Tax invoices',
  location: 'Palwal, Haryana',
} as const;

export const HK_BILL_COMPANY: BillCompany = {
  name: HK_APP.legalName,
  addressLine1: 'No 418, Jawahar Nagar',
  addressLine2: 'Palwal, Haryana',
  phone: '',
  gstin: '06BSRPS8447M3ZK',
  stateName: 'Haryana',
  stateCode: '06',
  cin: '',
  email: '',
  pan: 'BSRPS8447M',
};

/** @deprecated use HK_APP */
export const DRG_APP = HK_APP;
/** @deprecated use HK_BILL_COMPANY */
export const DRG_BILL_COMPANY = HK_BILL_COMPANY;
