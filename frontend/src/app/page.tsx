import type { Metadata } from 'next'
import { VoiceChatApp } from '@/components/VoiceChatApp'
import { pageMetadata } from '@/lib/seo'

// Server component so the homepage can declare its own canonical. VoiceChatApp
// is a client component and carries its own 'use client'.
export const metadata: Metadata = pageMetadata({
  title: 'Free Random Voice Chat with Strangers',
  description:
    'Talk to strangers by voice, free and with no signup. Get matched instantly with random people worldwide, filter by country and age, and hang up any time.',
  path: '/',
})

export default function Home() {
  return <VoiceChatApp />
}
