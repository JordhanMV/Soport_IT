import { PropsWithChildren } from 'react'

export function PageHeader({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">INVENTARIO / {title.toLocaleUpperCase('es-MX')}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  )
}
