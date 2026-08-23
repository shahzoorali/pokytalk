/**
 * GA4 funnel instrumentation.
 *
 * The app previously loaded gtag.js but fired no custom events, so the only
 * answerable questions were pageview-level. Nothing measured the funnel that
 * actually matters here:
 *
 *   land -> tap Call -> grant mic -> enter queue -> get matched -> WebRTC
 *   connects -> talk for N seconds -> come back
 *
 * Every step above can fail independently and each failure looks identical in
 * pageview data (one session, one page, then gone). These events separate them.
 *
 * Consent: gtag Consent Mode v2 is initialised in layout.tsx with everything
 * denied by default, so events fired before the user accepts are held/cookieless
 * rather than dropped. Nothing here needs its own consent check — do not add one
 * or events will be double-gated.
 *
 * Ad blockers routinely block gtag.js on a site like this, so every call must be
 * a no-op when window.gtag is missing. Never let tracking throw into a call flow.
 */

/** Params are flat scalars — GA4 rejects nested objects. */
type EventParams = Record<string, string | number | boolean | undefined>

const DEBUG =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true' ||
    window.location.hostname === 'localhost')

function send(name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return

  // Strip undefined so GA4 doesn't record empty custom dimensions.
  const clean: EventParams = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) clean[key] = value
  }

  if (DEBUG) console.log(`📊 [analytics] ${name}`, clean)

  try {
    const w = window as any
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, clean)
    } else {
      // gtag.js hasn't loaded yet (afterInteractive) or is blocked. Queueing on
      // dataLayer means events fired early still land if the script arrives.
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push(['event', name, clean])
    }
  } catch {
    // Tracking must never break a call. Swallow deliberately.
  }
}

/** Seconds elapsed since `start`, rounded. Null-safe so callers don't branch. */
function secondsSince(start: number | null): number | undefined {
  if (start === null) return undefined
  return Math.round((Date.now() - start) / 1000)
}

/**
 * Coarse duration buckets. GA4 can bucket a numeric metric itself, but only
 * after `duration_seconds` is registered as a custom metric — the string keeps
 * the funnel readable in the default reports from day one.
 */
export function durationBucket(seconds: number): string {
  if (seconds < 10) return '0-10s'
  if (seconds < 60) return '10-60s'
  if (seconds < 300) return '1-5m'
  if (seconds < 900) return '5-15m'
  return '15m+'
}

// ---------------------------------------------------------------------------
// Funnel events
// ---------------------------------------------------------------------------

/** Visitor context, fired once per page load. Separates first-timers from
 *  returners, which is the retention number the product currently can't see. */
export function trackVisitor(priorCalls: number): void {
  send('visitor_identified', {
    visitor_type: priorCalls > 0 ? 'returning' : 'new',
    prior_calls: priorCalls,
  })
}

/** Step 1 — the green button was pressed. Compare against pageviews for the
 *  single most important ratio on the site: what fraction of arrivals try. */
export function trackCallTap(onlineUsers: number | undefined, hasFilters: boolean): void {
  send('call_tap', {
    online_users: onlineUsers,
    has_filters: hasFilters,
  })
}

/** Step 2 — the getUserMedia outcome. A low grant rate is a UX problem
 *  (asking too early, no explanation); it is invisible without this. */
export function trackMicPermission(granted: boolean, reason?: string): void {
  send('mic_permission', {
    result: granted ? 'granted' : 'denied',
    error_reason: reason,
  })
}

/** Step 3 — entered the matching queue. */
export function trackSearchStart(onlineUsers: number | undefined, hasFilters: boolean): void {
  send('search_start', {
    online_users: onlineUsers,
    has_filters: hasFilters,
  })
}

/** Step 4a — matched. `wait_seconds` is the number that decides whether the
 *  liquidity work (push notifications, prime time) is urgent. */
export function trackMatchFound(searchStartedAt: number | null, partnerCountry?: string): void {
  send('match_found', {
    wait_seconds: secondsSince(searchStartedAt),
    partner_country: partnerCountry,
  })
}

/** Step 4b — gave up waiting. The wait time here is how long people are
 *  willing to queue, which sets the ceiling for any matching change. */
export function trackSearchAbandon(searchStartedAt: number | null, onlineUsers: number | undefined): void {
  const waitSeconds = secondsSince(searchStartedAt)
  send('search_abandon', {
    wait_seconds: waitSeconds,
    wait_bucket: waitSeconds !== undefined ? durationBucket(waitSeconds) : undefined,
    online_users: onlineUsers,
  })
}

/** Step 5 — WebRTC P2P actually established. A match that never reaches this
 *  is a failed conversation even though the server counted it as a session;
 *  the backend already tracks the same thing as CallSession.webrtcConnected. */
export function trackCallConnected(matchedAt: number | null): void {
  send('call_connected', {
    setup_seconds: secondsSince(matchedAt),
  })
}

/** Step 5-fail — matched but never connected. This is the silent killer:
 *  both users see "connecting" forever and blame the product. */
export function trackCallConnectFailed(matchedAt: number | null, retries: number): void {
  send('call_connect_failed', {
    setup_seconds: secondsSince(matchedAt),
    retries,
  })
}

/** Step 6 — the call ended. `connected` distinguishes a real conversation from
 *  a match that never got audio flowing; `ended_by` shows who hung up. */
export function trackCallEnded(options: {
  durationSeconds: number
  connected: boolean
  endedBy: 'self' | 'partner'
  partnerCountry?: string
}): void {
  send('call_ended', {
    duration_seconds: options.durationSeconds,
    duration_bucket: durationBucket(options.durationSeconds),
    connected: options.connected,
    ended_by: options.endedBy,
    partner_country: options.partnerCountry,
  })
}

// ---------------------------------------------------------------------------
// Retention events — the callback loop is the only existing return mechanism,
// so its usage rate is the baseline any retention work has to beat.
// ---------------------------------------------------------------------------

export function trackCallbackRequested(): void {
  send('callback_requested')
}

export function trackCallbackAccepted(): void {
  send('callback_accepted')
}

export function trackCallbackDeclined(): void {
  send('callback_declined')
}
