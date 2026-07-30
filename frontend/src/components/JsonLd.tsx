/**
 * Renders a JSON-LD structured data block. Server component by design — the
 * markup must be present in the static HTML for crawlers that don't run JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
