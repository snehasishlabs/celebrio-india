export type VendorService =
  | 'venue'
  | 'catering'
  | 'bar-beverage'
  | 'florals-decor'
  | 'photography-video'
  | 'sound-lighting-av'
  | 'live-music-dj'
  | 'planning-styling'
  | 'transportation'
  | 'stationery-paper'
  | 'cake-dessert'
  | 'rentals';

export type ContractStatus =
  | 'prospecting'
  | 'quote-received'
  | 'negotiating'
  | 'contract-signed'
  | 'deposit-paid'
  | 'completed'
  | 'cancelled';

export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  service: VendorService;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  contractStatus: ContractStatus;
  quotedCost: number;
  finalCost?: number;
  depositAmount: number;
  depositPaid: boolean;
  notes?: string;
  rating?: number; // 1-5 stars
}
