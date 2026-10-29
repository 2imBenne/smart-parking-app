import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, type MenuProps } from 'antd'
import { ShieldCheck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthSession } from '../../../shared/auth/session'
import { adminBreadcrumbLabels, adminNavigationItems, type AdminNavigationIcon } from '../navigation/adminNavigation'
import '../styles/admin.css'

const { Header, Sider, Content, Footer } = Layout
const icons: Record<AdminNavigationIcon, ReactNode> = { dashboard: <AppstoreOutlined />, parking: <ShopOutlined />, users: <TeamOutlined />, transactions: <TransactionOutlined />, withdrawals: <WalletOutlined />, disputes: <AlertOutlined />, audit: <AuditOutlined />, notifications: <BellOutlined /> }

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const selectedKey = useMemo(() => adminNavigationItems.map(item => item.key).sort((a, b) => b.length - a.length).find(key => location.pathname === key || location.pathname.startsWith(`${key}/`)) ?? '/admin/dashboard', [location.pathname])
  const breadcrumbs = location.pathname.split('/').filter(Boolean).map((segment, index) => ({ key: `${segment}-${index}`, title: adminBreadcrumbLabels[segment] ?? (/^\d+$/.test(segment) ? `#${segment}` : segment) }))
  const handleLogout = () => { clearAuthSession(); navigate('/login', { replace: true }) }
  const userMenu: MenuProps = { items: [{ key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ quản trị' }, { type: 'divider' }, { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }], onClick: ({ key }) => key === 'logout' ? handleLogout() : navigate('/admin/profile') }
  const menuItems: MenuProps['items'] = adminNavigationItems.map(item => ({ key: item.key, icon: icons[item.icon], label: item.label }))

  return <Layout className="admin-shell">
    <Sider breakpoint="lg" collapsed={collapsed} collapsedWidth={72} className="admin-sider" onCollapse={setCollapsed} width={264}>
      <button className="admin-brand" type="button" onClick={() => navigate('/admin/dashboard')}><BankOutlined />{!collapsed && <span><strong>SmartTruck</strong><small>Trung tâm quản trị</small></span>}</button>
      <Menu className="admin-menu" items={menuItems} mode="inline" onClick={({ key }) => navigate(key)} selectedKeys={[selectedKey]} />
    </Sider>
    <Layout className="admin-main">
      <Header className="admin-header"><div className="admin-header-start"><Button aria-label={collapsed ? 'Mở menu' : 'Thu menu'} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(value => !value)} type="text" /><Breadcrumb items={breadcrumbs} /></div><Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}><button className="admin-user-button" type="button" aria-label="Mở menu tài khoản"><Avatar icon={<UserOutlined />} /><span><strong>Quản trị viên</strong><small>{session?.phone ?? 'Admin'}</small></span></button></Dropdown></Header>
      <Content className="admin-content"><Outlet /></Content>
      <Footer className="admin-footer">
        <div className="admin-footer-inner">
          <span><strong>SmartTruck Admin</strong><small>Trung tâm quản trị hệ thống</small></span>
          <span className="admin-footer-status"><ShieldCheck aria-hidden="true" /> Kết nối bảo mật</span>
          <small>© 2026 SmartTruck</small>
        </div>
      </Footer>
    </Layout>
  </Layout>
}
