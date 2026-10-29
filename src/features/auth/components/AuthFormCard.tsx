import type { ReactNode } from 'react'
import { Typography } from 'antd'
import { NavLink } from 'react-router-dom'

type AuthFormCardProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  className?: string
  legal?: ReactNode
}

export function AuthFormCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
  legal,
}: AuthFormCardProps) {
  return (
    <article
      className={className ? `auth-card ${className}` : 'auth-card'}
      aria-labelledby="auth-title"
    >
      <nav className="auth-tabs" aria-label="Chọn hình thức xác thực">
        <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')} end>
          Đăng nhập
        </NavLink>
        <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
          Đăng ký
        </NavLink>
      </nav>
      <div className="auth-card-head">
        <span className="auth-form-eyebrow">{eyebrow}</span>
        <Typography.Title id="auth-title" level={1}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      </div>
      {children}
      <div className="auth-card-footer">{footer}</div>
      {legal ? <div className="auth-legal">{legal}</div> : null}
    </article>
  )
}
