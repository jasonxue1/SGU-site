import { Link } from "react-router-dom";

export function AdminDashboard() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>总览</h1>
      <p className="muted">管理首页与各子站页面内容、成员与开源项目等。</p>
      <div className="grid" style={{ paddingTop: 16 }}>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>站点与品牌</h3>
          <p className="muted">标题、Logo、Hero、备案号、加入我们/服规文案、全站配色预设与外链。</p>
          <Link className="btn btn-primary" to="/admin/site">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>内容卡片</h3>
          <p className="muted">首页卡片，支持图片、外链与排序。</p>
          <Link className="btn btn-primary" to="/admin/cards">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>近期公告</h3>
          <p className="muted">首页公告区，用于发布活动与重要说明。</p>
          <Link className="btn btn-primary" to="/admin/announcements">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>服务器历史</h3>
          <p className="muted">时间线记录，前台「服务器历史」页面。</p>
          <Link className="btn btn-primary" to="/admin/server-history">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>成员栏</h3>
          <p className="muted">前台「成员」页面展示。</p>
          <Link className="btn btn-primary" to="/admin/members">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>开源项目</h3>
          <p className="muted">前台「开源项目」页面。</p>
          <Link className="btn btn-primary" to="/admin/open-source">
            前往编辑
          </Link>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>管理员</h3>
          <p className="muted">后台账号与密码。</p>
          <Link className="btn btn-primary" to="/admin/users">
            前往管理
          </Link>
        </div>
      </div>
    </div>
  );
}
