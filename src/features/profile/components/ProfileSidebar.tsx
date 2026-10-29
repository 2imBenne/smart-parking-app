import { KeyRound, ReceiptText, Truck, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const items = [{ to: '/profile', label: 'Thông tin cá nhân', icon: <UserRound /> }, { to: '/vehicles', label: 'Phương tiện của tôi', icon: <Truck /> }, { to: '/payments', label: 'Thanh toán & hóa đơn', icon: <ReceiptText /> }, { to: '/change-password', label: 'Đổi mật khẩu', icon: <KeyRound /> }]
export function ProfileSidebar() { return <aside className="profile-sidebar" aria-label="Cài đặt tài khoản">{items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>{item.icon}<span>{item.label}</span></NavLink>)}</aside> }
