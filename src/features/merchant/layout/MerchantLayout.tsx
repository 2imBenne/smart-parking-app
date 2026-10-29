import {
  AppstoreOutlined,
  BankOutlined,
  BellOutlined,
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QrcodeOutlined,
  ShopOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Breadcrumb, Button, Dropdown, Layout, Menu, Tag, type MenuProps } from 'antd'
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthSession } from '../../../shared/auth/session'
import { getMerchantUnreadNotificationCount } from '../notifications/api/merchantNotificationApi'
import { merchantBreadcrumbLabels, merchantNavigationItems, type MerchantNavigationItem } from '../navigation/merchantNavigation'

const { Header, Sider, Content } = Layout

const merchantIcons: Record<MerchantNavigationItem['icon'], ReactNode> = {
  dashboard: <AppstoreOutlined />,
  parking: <ShopOutlined />,
  booking: <CalendarOutlined />,
  qr: <QrcodeOutlined />,
  revenue: <DollarOutlined />,
  withdrawal: <WalletOutlined />,
  profile: <UserOutlined />,
  dispute: <ExclamationCircleOutlined />,
  notification: <BellOutlined />,
}

export function MerchantLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const count = await getMerchantUnreadNotificationCount()
        if (active) setUnreadCount(count)
      } catch {
        if (active) setUnreadCount(0)
      }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 20_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [location.pathname])

  const selectedKey = useMemo(() => {
    return merchantNavigationItems
      .map((item) => item.key)
      .sort((a, b) => b.length - a.length)
      .find((key) => location.pathname === key || location.pathname.startsWith(`${key}/`)) ?? '/merchant/dashboard'
  }, [location.pathname])

  const menuItems: MenuProps['items'] = merchantNavigationItems.map((item) => ({
    key: item.key,
    icon: merchantIcons[item.icon],
    disabled: item.blockedByBackend,
    label: (
      <span className="merchant-menu-label">
        {item.label}
        {item.icon === 'notification' && unreadCount > 0 ? (
          <Badge className="merchant-menu-badge" count={unreadCount} overflowCount={99} />
        ) : null}
        {item.blockedByBackend && <Tag color="default">BE gap</Tag>}
      </span>
    ),
    title: item.blockedByBackend ? `${item.label} – BLOCKED_BY_BACKEND` : item.label,
  }))

  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, segments) => ({
      title: merchantBreadcrumbLabels[segment] ?? (index > 1 && /^\d+$/.test(segment) ? `#${segment}` : segment),
      href: index === 0 ? '/merchant/dashboard' : undefined,
      onClick: index === 0 ? (event: MouseEvent) => { event.preventDefault(); navigate('/merchant/dashboard') } : undefined,
      key: `${segment}-${index}-${segments.length}`,
    }))

  const logout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const userMenu: MenuProps = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') navigate('/merchant/profile')
      if (key === 'logout') logout()
    },
  }

  return (
    <Layout className="merchant-shell">
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        collapsedWidth={72}
        className="merchant-sider"
        onCollapse={setCollapsed}
        width={260}
      >
        <button className="merchant-brand" onClick={() => navigate('/merchant/dashboard')}>
          <BankOutlined />
          {!collapsed && <span><strong>SmartTruck</strong><small>Merchant Portal</small></span>}
        </button>
        <Menu
          className="merchant-menu"
          items={menuItems}
          mode="inline"
          onClick={({ key }) => navigate(key)}
          selectedKeys={[selectedKey]}
        />
      </Sider>
      <Layout>
        <Header className="merchant-header">
          <div className="merchant-header-start">
            <Button
              aria-label={collapsed ? 'Mở menu' : 'Thu menu'}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              type="text"
            />
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div className="merchant-header-end">
            <Button
              aria-label="Thông báo"
              className="merchant-notif-bell"
              icon={
                <Badge count={unreadCount} overflowCount={99} size="small">
                  <BellOutlined />
                </Badge>
              }
              onClick={() => navigate('/merchant/notifications')}
              type="text"
            />
            <Dropdown arrow autoAdjustOverflow menu={userMenu} overlayClassName="merchant-user-dropdown" placement="bottomRight" trigger={['click']}>
              <button aria-label="Mở menu tài khoản" className="merchant-user-menu" type="button">
                <Avatar className="merchant-user-avatar" icon={<UserOutlined />} />
                <span className="merchant-user-copy"><strong>{session?.phone || 'Merchant'}</strong><small>Chủ bãi</small></span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="merchant-content"><Outlet /></Content>
      </Layout>
    </Layout>
  )
}
