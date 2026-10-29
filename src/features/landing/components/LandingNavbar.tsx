import { Dropdown, type MenuProps } from 'antd'
import { Bell, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthSession } from '../../../shared/auth/session'

const links = [
  { to: '/', label: 'Trang chủ' },
  { to: '/parking', label: 'Tìm bãi đỗ' },
  { to: '/bookings', label: 'Đặt chỗ của tôi' },
  { to: '/queues', label: 'Hàng đợi' },
  { to: '/payments', label: 'Thanh toán' },
  { to: '/notifications', label: 'Thông báo' },
]

export function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const session = getAuthSession()
  const location = useLocation()
  const navigate = useNavigate()
  const accountActive = location.pathname.startsWith('/dashboard') || ['/profile', '/vehicles', '/change-password'].includes(location.pathname)
  const roleLabel = session?.role === 'DRIVER' ? 'Tài xế' : session?.role === 'MERCHANT' ? 'Chủ bãi' : 'Quản trị viên'
  const profilePath = session?.role === 'DRIVER' ? '/profile' : session?.role === 'MERCHANT' ? '/merchant/profile' : '/admin/profile'
  const accountMenu: MenuProps = {
    items: [
      { key: 'account', disabled: true, label: <div className="nav-account-summary"><strong>{roleLabel}</strong><span>{session?.phone}</span></div> },
      { type: 'divider' },
      { key: 'profile', icon: <UserRound size={16} />, label: 'Hồ sơ cá nhân' },
      { key: 'logout', danger: true, icon: <LogOut size={16} />, label: 'Đăng xuất' },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') navigate(profilePath)
      if (key === 'logout') {
        clearAuthSession()
        setOpen(false)
        navigate('/login', { replace: true })
      }
    },
  }

  return <header className="stitch-nav"><div className="stitch-nav-inner">
    <Link to="/" className="stitch-logo">SmartTruck</Link>
    <nav className={open ? 'nav-links open' : 'nav-links'}>
      {links.map(link => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{link.label}</NavLink>)}
    </nav>
    <div className="nav-actions">
      {session ? <><Link className="notification-bell" to="/notifications" aria-label="Thông báo"><Bell size={19} /><span /></Link><Dropdown menu={accountMenu} placement="bottomRight" trigger={['click']} overlayClassName="nav-account-dropdown"><button className={accountActive ? 'user-circle active' : 'user-circle'} type="button" aria-label="Mở menu tài khoản" aria-haspopup="menu"><UserRound size={18} /></button></Dropdown></> : <><Link className="login-link" to="/login">Đăng nhập</Link><Link className="register-link" to="/register">Đăng ký</Link></>}
      <button className="mobile-menu" aria-label={open ? 'Đóng menu' : 'Mở menu'} onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}</button>
    </div>
  </div></header>
}
