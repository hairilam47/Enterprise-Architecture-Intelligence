export type BreadcrumbItem = {
  id: string
  label: string
  onSelect?: () => void
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="workspace-breadcrumbs" aria-label="Workspace breadcrumbs">
      {items.map((item, index) => (
        <button key={item.id} type="button" disabled={!item.onSelect} onClick={item.onSelect}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.label}
        </button>
      ))}
    </nav>
  )
}
