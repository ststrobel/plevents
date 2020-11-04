export interface TenantI {
  id?: string;
  active: boolean;
  name: string;
  logo: string;
  path: string;
  consentTeaser1: string;
  consentText1: string;
  consentTeaser2: string;
  consentText2: string;
  color: string;
  subscriptionUntil: Date;
  stripeUserId?: string;
  activeUntil?: Date;
}
