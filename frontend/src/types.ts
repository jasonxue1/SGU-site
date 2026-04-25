export type ThemePresetId = "default" | "ocean" | "forest" | "lavender" | "slate" | "custom";

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
  /** 加入我们页正文（Markdown） */
  joinPageBody?: string;
  /** 服规页标题 */
  groupRulesTitle?: string;
  /** 服规正文（Markdown） */
  groupRulesMarkdown?: string;
  /** 全站配色预设；custom 时使用 customPalette */
  colorPreset?: ThemePresetId;
  /** 自定义四色（#RRGGBB），对应 --palette-1 … --palette-4 */
  customPalette?: Partial<{ p1: string; p2: string; p3: string; p4: string }>;
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
  imageUrl: string | null;
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

/** 首页「近期公告」条目 */
export type SiteAnnouncementItem = {
  id: string;
  title: string;
  body: string;
  linkLabel: string | null;
  linkUrl: string | null;
  /** 公告展示日期，ISO 8601；未设则为 null */
  announcedAt: string | null;
  sortOrder: number;
};

export type PublicSitePayload = {
  config: SiteConfig;
  cards: PublicCard[];
  serverHistory: ServerHistoryItem[];
  members: TeamMemberItem[];
  openSourceProjects: OpenSourceProjectItem[];
  /**
   * 全站首包数据。旧版 /api/public/site 可能无此字段；`PublicShell` 会补成 `[]` 再入 Context。
   */
  announcements?: SiteAnnouncementItem[];
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};
