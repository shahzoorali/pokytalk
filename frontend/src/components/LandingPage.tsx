import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'

export interface LandingSection {
  heading: string
  paragraphs: string[]
  /** Optional bullet list rendered after the paragraphs. */
  list?: string[]
}

export interface LandingFaq {
  question: string
  answer: string
}

export interface ComparisonTable {
  heading: string
  /** Sentence or two of context rendered above the table. */
  intro?: string
  /** Column headers. The first column is the row-label column and is added
   *  automatically, so pass only the option names, e.g. ['Pokytalk', 'Omegle']. */
  columns: string[]
  rows: Array<{
    label: string
    /** One entry per column. `true`/`false` render as a check or cross with an
     *  accessible label; strings render verbatim. */
    values: Array<string | boolean>
  }>
  /** Optional note rendered below the table (e.g. "as of 2026"). */
  note?: string
}

/**
 * Shared shell for the high-intent landing pages. Fully server-rendered so the
 * copy is present in the static HTML — the homepage's only prose lives in a
 * client component, which is part of why the site had so little indexable text.
 */
function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="font-semibold text-primary-400" aria-label="Yes">
        &#10003;
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="text-gray-600" aria-label="No">
        &#10007;
      </span>
    )
  }
  return <span>{value}</span>
}

export function LandingPage({
  h1,
  intro,
  crumbName,
  path,
  sections,
  comparison,
  faqs,
}: {
  h1: string
  intro: string
  crumbName: string
  path: string
  sections: LandingSection[]
  comparison?: ComparisonTable
  faqs: LandingFaq[]
}) {
  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <JsonLd
          data={breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: crumbName, path },
          ])}
        />
        <JsonLd data={faqJsonLd(faqs)} />

        <Breadcrumbs trail={[{ name: 'Home', href: '/' }, { name: crumbName }]} />

        <h1 className="mb-6 text-4xl font-bold sm:text-5xl">{h1}</h1>
        <p className="mb-8 text-lg leading-relaxed text-gray-200">{intro}</p>

        <Link
          href="/"
          className="inline-block rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-500"
        >
          Start a voice chat →
        </Link>

        <div className="mt-14 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-4 text-2xl font-semibold text-white">{section.heading}</h2>
              <div className="space-y-4 leading-relaxed text-gray-300">
                {section.paragraphs.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-gray-300">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {comparison && (
          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-semibold text-white">{comparison.heading}</h2>
            {comparison.intro && (
              <p className="mb-6 leading-relaxed text-gray-300">{comparison.intro}</p>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-100">
                    <th scope="col" className="p-3 font-semibold">
                      &nbsp;
                    </th>
                    {comparison.columns.map((col) => (
                      <th key={col} scope="col" className="p-3 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.label} className="border-t border-gray-700">
                      <th
                        scope="row"
                        className="p-3 font-medium text-gray-200"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td key={i} className="p-3 text-gray-300">
                          <ComparisonCell value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comparison.note && (
              <p className="mt-3 text-xs text-gray-500">{comparison.note}</p>
            )}
          </section>
        )}

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-semibold text-white">Frequently asked questions</h2>
          <dl className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="mb-2 font-semibold text-gray-100">{faq.question}</dt>
                <dd className="leading-relaxed text-gray-300">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-14 rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold">Ready to talk to someone?</h2>
          <p className="mb-6 text-gray-300">
            No account, no download. Allow microphone access and you&apos;ll be connected to a
            random person in seconds.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-500"
          >
            Start a voice chat →
          </Link>
        </div>
        {/* No manual <AdSense> unit: there are no real ad slots yet, and the
            site-wide loader in layout.tsx runs Auto Ads on these pages. */}
      </div>
    </div>
  )
}
