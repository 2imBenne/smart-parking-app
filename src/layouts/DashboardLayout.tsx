import {
  AuditOutlined,
  CarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QrcodeOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Layout, Menu, Tag, Typography } from 'antd'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthSession } from '../shared/auth/session'
import { LandingNavbar } from '../features/landing/components/LandingNavbar'
import { AiChatWidget } from '../features/ai-copilot/components/AiChatWidget'

const { Header, Sider, Content } = Layout

const driverMenuItems = [
  {
    key: '/dashboard',
    icon: <AuditOutlined />,
    label: 'Tổng quan',
  },
  {
    key: '/dashboard/vehicles',
    icon: <CarOutlined />,
    label: 'Quản lý phương tiện',
  },
  {
    key: '/dashboard/search',
    icon: <EnvironmentOutlined />,
    label: 'Tìm kiếm bãi đỗ',
  },
]

const merchantMenuItems = [
  {
    key: '/dashboard',
    icon: <AuditOutlined />,
    label: 'Tổng quan',
  },
  {
    key: '/dashboard/parking-lots',
    icon: <ShopOutlined />,
    label: 'Quản lý bãi đỗ',
  },
]

const adminMenuItems = [
  {
    key: '/dashboard',
    icon: <AuditOutlined />,
    label: 'Tổng quan',
  },
  {
    key: '/dashboard/users',
    icon: <CarOutlined />,
    label: 'Quản lý người dùng',
  },
  {
    key: '/dashboard/qr',
    icon: <QrcodeOutlined />,
    label: 'QR Check-in/out',
  },
]

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()

  const logout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  // Chọn menu theo vai trò
  const getMenuItems = () => {
    switch (session?.role) {
      case 'DRIVER':
        return driverMenuItems
      case 'MERCHANT':
        return merchantMenuItems
      case 'ADMIN':
        return adminMenuItems
      default:
        return driverMenuItems
    }
  }

  const roleLabel = () => {
    switch (session?.role) {
      case 'DRIVER':
        return 'Tài xế'
      case 'MERCHANT':
        return 'Chủ bãi'
      case 'ADMIN':
        return 'Quản trị'
      default:
        return session?.role ?? ''
    }
  }

  if (session?.role === 'DRIVER') {
    return (
      <div className="driver-dashboard-layout">
        <LandingNavbar />
        <main className="driver-dashboard-content">
          <Outlet />
        </main>
        <AiChatWidget />
      </div>
    )
  }

  return (
    <Layout className={`app-shell app-shell--${session?.role?.toLowerCase() ?? 'guest'}`}>
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        collapsedWidth={72}
        className="app-sider"
        onCollapse={setCollapsed}
        width={260}
      >
        <div className="dashboard-brand">
          <div className="brand-mark small">
            <CarOutlined />
          </div>
          {!collapsed && (
            <div>
              <strong>Smart Parking</strong>
              <span>Vận hành</span>
            </div>
          )}
        </div>
        <Menu
          className="app-menu"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          mode="inline"
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Button
            aria-label={collapsed ? 'Mở menu' : 'Thu menu'}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            type="text"
          />
          <div className="header-user">
            <div className="user-meta">
              <Typography.Text strong>{session?.phone}</Typography.Text>
              <Tag color="green">{roleLabel()}</Tag>
            </div>
            <Avatar>{session?.role?.charAt(0) ?? 'U'}</Avatar>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
      <AiChatWidget />
    </Layout>
  )
}
