import Link from 'next/link'

export interface Crumb {
  name: string
  /** Omit on the current page — it renders as plain text, not a link. */
  href?: string
}

/**
 * Visible breadcrumb trail. Pairs with breadcrumbJsonLd() in lib/seo.ts —
 * Google expects the markup and the visible trail to match.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 text-gray-400">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1
          return (
            <li key={crumb.name} className="flex items-center gap-x-2">
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="text-primary-400 hover:text-primary-300">
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-gray-300" aria-current={isLast ? 'page' : undefined}>
                  {crumb.name}
                </span>
              )}
              {!isLast && <span aria-hidden="true" className="text-gray-600">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
