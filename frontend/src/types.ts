export type SiteConfig = {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  /** 首页首屏 Banner 背景图（外链或 /uploads/public/…） */
  heroBannerUrl?: string;
  /** 历史字段；前台不再展示多图，保存站点配置时会清空 */
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
  joinPageBody?: string;
};

export type PublicCard = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string;
  imageUrl: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  badge: string | null;
  sortOrder: number;
  published?: boolean;
};

export type ServerHistoryItem = {
  id: string;
  title: string;
  body: string;
  eventDate: string | null;
  sortOrder: number;
};

export type TeamMemberItem = {
  id: string;
  name: string;
  role: string | null;
  bio: string;
  avatarUrl: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  sortOrder: number;
};

export type OpenSourceProjectItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
  sortOrder: number;
};

export type PublicSitePayload = {
  config: SiteConfig;
  cards: PublicCard[];
  serverHistory: ServerHistoryItem[];
  members: TeamMemberItem[];
  openSourceProjects: OpenSourceProjectItem[];
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};
