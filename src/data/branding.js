export const DEFAULT_LOGO_IMAGE = '/logo.png';
export const DEFAULT_FAVICON = '/favicon.png';
export const DEFAULT_FAVICON_CIRCULAR = '/favicon.png';

export const DEFAULT_SOCIAL_LINKS = [
  {
    id: 'facebook',
    platform: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61594704587784',
    enabled: true
  },
  {
    id: 'twitter',
    platform: 'twitter',
    label: 'Twitter / X',
    url: 'https://x.com/thesehatbuddy',
    enabled: true
  },
  {
    id: 'instagram',
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/thesehatbuddy/',
    enabled: true
  },
  {
    id: 'linkedin',
    platform: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/the-sehat-buddy/',
    enabled: true
  },
  {
    id: 'youtube',
    platform: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/@TheSehatBuddy',
    enabled: true
  }
];

export const initialBranding = {
  siteName: 'The Sehat Buddy',
  tagline: 'Your Health. Our Priority.',
  logoType: 'image', // 'default' | 'image' | 'none'
  logoImage: '/logo.png',
  showLogo: true,
  showTagline: true,
  faviconType: 'default', // 'default' | 'custom' | 'logo'
  favicon: '/favicon.png',
  faviconCircular: true,
  socialLinks: DEFAULT_SOCIAL_LINKS
};
