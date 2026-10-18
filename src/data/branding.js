export const DEFAULT_FAVICON_CIRCULAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23FFFFFF'/%3E%3Cpath d='M24.5 17.5c1.3-1.3 2.6-2.8 2.6-4.8 0-2.3-1.9-4.2-4.2-4.2-1.5 0-2.6.4-3.9 1.7-1.3-1.3-2.4-1.7-3.9-1.7-2.3 0-4.2 1.9-4.2 4.2 0 2 1.3 3.5 2.6 4.8l6.1 6.1 5-6.1Z' stroke='%232563EB' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9.5 15.5h3.6l.6-.9 1.8 3.8 1.8-5.8 1.4 2.9h4.8' stroke='%232563EB' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export const initialBranding = {
  siteName: 'The Sehat Buddy',
  tagline: 'Your Health. Our Priority.',
  logoType: 'default', // 'default' | 'image' | 'none'
  logoImage: '',
  showLogo: true,
  showTagline: true,
  faviconType: 'default', // 'default' | 'custom' | 'logo'
  favicon: DEFAULT_FAVICON_CIRCULAR,
  faviconCircular: true
};
