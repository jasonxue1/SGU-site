import type { PublicSitePayload } from "./types";
import { announcements } from "./data/announcements";
import { history } from "./data/history";
import { members } from "./data/members";
import { openSourceProjects } from "./data/openSourceProjects";

export const staticSiteData: PublicSitePayload = {
  config: {
    siteName: "SGU Server",
    tagline: "技术 · 红石 · 生存 · 建筑",
    logoUrl: "/images/site/logo.png",
    heroTitle: "欢迎来到SGU技术生存服务器官网",
    heroSubtitle:
      "我们致力于打造一个理想中的，美好，自由，平等的技术生存服务器",
    discordUrl: "https://discord.gg/FdyU5YR7te",
    bilibiliUrl:
      "https://space.bilibili.com/3546384068249937?spm_id_from=333.337.search-card.all.click",
    footerNote: "SGU Server 2026",
    seoDescription: "Minecraft SGU Server",
    icpLicense: "桂ICP备2025061738号-2",
    joinPageTitle: "加入SGU Server",
    heroBannerUrl: "/images/site/hero-banner.png",
    colorPreset: "slate",
    groupRulesTitle: "服规及群规",
    customPalette: {
      p4: "#7c7575",
      p3: "#b8b0b0",
      p2: "#dfd3d3",
      p1: "#fbf0f0",
    },
  },
  cards: [
    {
      title: "稳定运行",
      subtitle: "长期开服",
      body: "服务器配置为 AMD 9950X3D + 96G 内存\n顶级配置保障你的游戏体验",
      imageUrl: null,
      linkLabel: null,
      linkUrl: null,
      badge: "运维",
    },
    {
      title: "社区规范",
      subtitle: "公平与尊重",
      body: "我们有详细的服规和群规\n公平和尊重我们很重视！",
      imageUrl: null,
      linkLabel: null,
      linkUrl: null,
      badge: "规则",
    },
  ],
  serverHistory: history,
  members,
  openSourceProjects,
  announcements,
};
