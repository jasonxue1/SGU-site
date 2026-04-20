import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultSiteConfig = {
  siteName: "生电服务器",
  tagline: "技术向 · 红石 · 生存",
  logoUrl: "",
  heroTitle: "欢迎来到我们的 Minecraft 生电服务器",
  heroSubtitle: "稳定、友好的技术向生存体验，欢迎浏览成员、开源项目与服务器历程。",
  discordUrl: "",
  bilibiliUrl: "",
  footerNote: "本站内容由管理员在后台维护。",
  seoDescription: "Minecraft 生电服务器官方网站",
  icpLicense: "",
  joinPageTitle: "加入我们",
  joinPageBody:
    "欢迎通过 Discord、哔哩哔哩等渠道了解入服方式与社区规则。具体信息由管理员在后台维护。",
};

async function main() {
  const user = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const pass = process.env.SEED_ADMIN_PASSWORD ?? "123456";
  const hash = await bcrypt.hash(pass, 12);

  await prisma.adminUser.upsert({
    where: { username: user },
    create: {
      username: user,
      passwordHash: hash,
      displayName: "超级管理员",
      isActive: true,
    },
    update: {
      passwordHash: hash,
    },
  });

  const row = await prisma.siteSetting.findUnique({ where: { key: "site_config" } });
  let current: Record<string, unknown> = {};
  if (row?.value) {
    try {
      current = JSON.parse(row.value) as Record<string, unknown>;
    } catch {
      current = {};
    }
  }
  const merged = { ...defaultSiteConfig, ...current };
  await prisma.siteSetting.upsert({
    where: { key: "site_config" },
    create: { key: "site_config", value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });

  const count = await prisma.contentCard.count();
  if (count === 0) {
    await prisma.contentCard.createMany({
      data: [
        {
          title: "生电友好",
          subtitle: "红石与机械",
          body: "欢迎建造刷怪塔、世吞、树场等工程。请在规则允许范围内分享设计与协作。",
          badge: "特色",
          sortOrder: 0,
          published: true,
        },
        {
          title: "稳定运行",
          subtitle: "长期开服",
          body: "定期维护窗口会提前公告。我们重视存档安全与性能优化。",
          badge: "运维",
          sortOrder: 1,
          published: true,
        },
        {
          title: "社区规范",
          subtitle: "公平与尊重",
          body: "禁止作弊、恶意破坏与骚扰。详细规则请见群内或公告。",
          badge: "规则",
          sortOrder: 2,
          published: true,
        },
      ],
    });
  }

  if ((await prisma.serverHistoryEvent.count()) === 0) {
    await prisma.serverHistoryEvent.createMany({
      data: [
        {
          title: "服务器开服",
          body: "第一条示例历史记录，可在后台修改或删除。",
          eventDate: new Date(),
          sortOrder: 0,
          published: true,
        },
      ],
    });
  }

  if ((await prisma.teamMember.count()) === 0) {
    await prisma.teamMember.createMany({
      data: [
        {
          name: "示例成员",
          role: "服主",
          bio: "可在后台替换为真实成员介绍。",
          sortOrder: 0,
          published: true,
        },
      ],
    });
  }

  if ((await prisma.openSourceProject.count()) === 0) {
    await prisma.openSourceProject.createMany({
      data: [
        {
          name: "示例开源仓库",
          description: "在后台填写真实项目名、简介与链接。",
          url: "https://github.com/",
          sortOrder: 0,
          published: true,
        },
      ],
    });
  }

  console.log("Seed OK. 管理员用户名:", user);
  console.log("已根据 SEED_ADMIN_PASSWORD 写入/更新密码哈希；生产环境请尽快改为强密码。");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
