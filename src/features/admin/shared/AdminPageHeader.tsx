import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly actions?: ReactNode
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return <header className="admin-page-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="admin-page-actions">{actions}</div>}</header>
}
