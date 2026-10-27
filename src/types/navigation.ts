export type NavSection =
  | 'dashboard'
  | 'events'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'simulator'
  | 'settings';

export interface NavItemConfig {
  id: NavSection;
  label: string;
  description: string;
  badge?: string;
}
