import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Omegle Alternative: Free Voice Chat',
  description:
    'Looking for an Omegle alternative? Pokytalk matches you with random strangers by voice, free and with no signup. Voice only, no video, no account needed.',
  path: '/omegle-alternative',
})

export default function OmegleAlternativePage() {
  return (
    <LandingPage
      crumbName="Omegle alternative"
      path="/omegle-alternative"
      h1="An Omegle Alternative Built Around Voice"
      intro="Omegle shut down in November 2023 after fourteen years, and the sites that replaced it mostly copied the same webcam-roulette format. Pokytalk takes a different approach: it is voice only. You get matched with a random stranger, you talk, and either of you can hang up at any moment. There is no video, no signup, and nothing to install."
      sections={[
        {
          heading: 'Voice only, and that is the point',
          paragraphs: [
            'The most common complaint about Omegle-style video sites was never the matching — it was what people pointed their cameras at. Removing video removes most of that problem at the source. There is no camera to turn on, so there is nothing explicit to broadcast.',
            'It also changes who shows up. When the only thing you can share is your voice, the people who stay are the ones who actually want a conversation. Calls tend to run longer and go somewhere, rather than being skipped in two seconds based on appearance.',
            'If you specifically want video chat with strangers, Pokytalk is not the right tool and we would rather say so plainly than waste your time.',
          ],
        },
        {
          heading: 'How Pokytalk compares to what Omegle did',
          paragraphs: [
            'Like Omegle, matching is random and anonymous, and you need no account to use it. Unlike Omegle, there is no video stream, and you can narrow matching by country and age range before you connect if you want to.',
            'Conversations are not recorded or stored. There is a text chat sidebar for sharing a word or a link mid-call, and the messages disappear when the call ends.',
            'You can also call someone back. If a conversation went well, that person shows up in your call history, and you can request them again later — something Omegle never offered. If you both request each other, the call connects automatically.',
          ],
        },
        {
          heading: 'Safety and moderation',
          paragraphs: [
            'Every call has report and block controls. Blocking someone prevents you from being matched with them again, and reports feed into moderation. Messages flagged as suspicious are surfaced as warnings during the call.',
            'You are never asked for your name, email, or phone number, so there is no personal data to leak. Do not share contact details, financial information, or your location with someone you just met — that advice applied to Omegle and it applies here.',
            'Pokytalk is for adults. You must be 18 or older to use it.',
          ],
        },
      ]}
      faqs={[
        {
          question: 'Is Pokytalk free?',
          answer:
            'Yes. Pokytalk is completely free and does not require an account, a subscription, or a download. The site is supported by advertising.',
        },
        {
          question: 'Does Pokytalk have video chat like Omegle?',
          answer:
            'No. Pokytalk is deliberately voice only. There is no webcam feature, which removes the explicit-content problem that made Omegle difficult to moderate.',
        },
        {
          question: 'Do I need to sign up or give an email address?',
          answer:
            'No. You do not create an account and you are never asked for an email address, phone number, or real name. Allow microphone access and you can start talking immediately.',
        },
        {
          question: 'Can I choose which country I get matched with?',
          answer:
            'Yes. You can select one or more countries and an age range before connecting. If no one matching your filters is available, Pokytalk will widen the search rather than leave you waiting indefinitely.',
        },
        {
          question: 'Are calls recorded?',
          answer:
            'No. Audio is sent peer to peer and is not recorded or stored. Text messages sent during a call are not kept after the call ends.',
        },
      ]}
    />
  )
}
