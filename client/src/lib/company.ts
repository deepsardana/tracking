import type { BillCompany } from '../api/bills';

/** DRG Power — app shell + invoice (same details as HR73B5666.pdf / server BILL_COMPANY_* env). */
export const DRG_APP = {
  shortName: 'DRG Power',
  legalName: 'DRG POWER TECHNOLOGY PVT. LTD. (2025-26)',
  appTitle: 'DRG Power Admin',
  tagline: 'Device inventory · Customers · Tax invoices',
  location: 'Gurgaon, Haryana',
} as const;

export const DRG_BILL_COMPANY: BillCompany = {
  name: DRG_APP.legalName,
  addressLine1: 'HNO-33R GROUND FLOOR NEW COLONY',
  addressLine2: 'NEAR GURDWARA, GURGAON',
  phone: 'TEL- 0124-4146966, MOB-9811133188',
  gstin: '06AAICD8552H2ZF',
  stateName: 'Haryana',
  stateCode: '06',
  cin: 'U51909HR2021PTC098799',
  email: 'DRGPOWER712@GMAIL.COM',
  pan: 'AAICD8552H',
};
