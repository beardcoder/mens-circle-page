import siteData from '../content/settings/site.json';

export interface SiteSettings {
  id: string;
  siteTitle: string;
  tagline: string;
  region: string;
  contactEmail: string;
  whatsappUrl?: string;
  operatorName: string;
  operatorAddress: string;
}

export const settings = siteData as SiteSettings;
