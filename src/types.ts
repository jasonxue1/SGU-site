export type ThemePresetId =
  | "default"
  | "ocean"
  | "forest"
  | "lavender"
  | "slate"
  | "custom";

export type SiteConfig = {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBannerUrl?: string;
  heroBannerUrls?: string[];
  serverAddress?: string;
  serverVersion?: string;
  discordUrl?: string;
  qqGroup?: string;
  bilibiliUrl?: string;
  footerNote?: string;
  seoDescription?: string;
  icpLicense?: string;
  joinPageTitle?: string;
  groupRulesTitle?: string;
  colorPreset?: ThemePresetId;
  customPalette?: Partial<{ p1: string; p2: string; p3: string; p4: string }>;
};

export type PublicCard = {
  title: string;
  subtitle: string | null;
  body: string;
  imageUrl: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  badge: string | null;
  published?: boolean;
};

export type ServerHistoryItem = {
  title: string;
  body: string;
  imageUrl: string | null;
  eventDate: string | null;
};

export type TeamMemberItem = {
  name: string;
  role: string | null;
  bio: string;
  avatarUrl: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
};

export type OpenSourceProjectItem = {
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
};

export type SiteAnnouncementItem = {
  title: string;
  body: string;
  linkLabel: string | null;
  linkUrl: string | null;
  announcedAt: string | null;
};

export type PublicSitePayload = {
  config: SiteConfig;
  cards: PublicCard[];
  serverHistory: ServerHistoryItem[];
  members: TeamMemberItem[];
  openSourceProjects: OpenSourceProjectItem[];
  announcements?: SiteAnnouncementItem[];
};
