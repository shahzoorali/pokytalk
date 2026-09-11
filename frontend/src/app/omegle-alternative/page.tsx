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
        {
          heading: 'Choosing an Omegle alternative that fits what you want',
          paragraphs: [
            'The sites that appear when you search for an Omegle replacement are not interchangeable. They differ on the thing that matters most — whether the default is video or voice — and on smaller details like whether you can filter by country, whether an account is needed, and whether the service is even still online.',
            'If your goal is a face-to-face webcam experience, a video roulette site is the honest recommendation and Pokytalk is not it. If your goal is conversation with a real person and the camera was always the part you tolerated rather than wanted, a voice-first service removes the friction and most of the moderation problem in one step.',
          ],
          list: [
            'Want webcam video: Chatroulette, OmeTV, or Emerald Chat.',
            'Want text only: Emerald Chat or a chat-focused subreddit.',
            'Want voice conversation with country and age filters and no signup: Pokytalk.',
            'Want to reconnect with people you enjoyed talking to: Pokytalk is currently the only one of these with a call-back feature.',
          ],
        },
        {
          heading: 'Moving over from Omegle',
          paragraphs: [
            'There is nothing to migrate. Omegle stored no profile, no friends list, and no history, so there is no export step and no account to close. Open Pokytalk, allow microphone access, and press call.',
            'The habits transfer directly. Open with a question rather than "hi", give each match a minute before deciding, and hang up without guilt when a conversation is not going anywhere. The one new habit worth building is using call-back: when a conversation is good, add the person from your call history so you can request them again instead of hoping to be re-matched by chance.',
          ],
        },
      ]}
      comparison={{
        heading: 'Pokytalk vs Omegle and other alternatives',
        intro:
          'How Pokytalk compares to Omegle and the video-roulette sites people most often move to. Details for other services are based on their publicly documented features and change over time.',
        columns: ['Pokytalk', 'Omegle', 'Chatroulette', 'Emerald Chat'],
        rows: [
          {
            label: 'Primary format',
            values: ['Voice', 'Video + text', 'Video', 'Video + text'],
          },
          {
            label: 'Still operating',
            values: [true, 'No, closed 2023', true, true],
          },
          { label: 'Account required', values: [false, false, false, 'Optional'] },
          {
            label: 'Explicit-content exposure',
            values: ['None (no video)', 'High', 'Moderate', 'Moderate'],
          },
          { label: 'Country filter', values: [true, false, false, 'Limited'] },
          { label: 'Age-range filter', values: [true, false, false, false] },
          { label: 'Call a good match back', values: [true, false, false, false] },
          {
            label: 'Cost',
            values: ['Free', 'Was free', 'Free + paid tier', 'Free + paid tier'],
          },
          { label: 'Works in browser, no install', values: [true, true, true, true] },
        ],
        note: 'Comparison compiled September 2026. Third-party features may have changed since.',
      }}
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
        {
          question: 'Why did Omegle shut down?',
          answer:
            'Omegle closed in November 2023 after its founder cited the unsustainable cost of fighting misuse of the platform, alongside mounting legal pressure. The site had run since 2009.',
        },
        {
          question: 'Is Pokytalk a good Omegle alternative for video chat?',
          answer:
            'No. Pokytalk is voice only and has no webcam feature at all. If you specifically want video chat with strangers, a video-roulette site will suit you better. Pokytalk is the better choice if the conversation mattered more than the camera.',
        },
        {
          question: 'What makes Pokytalk different from other Omegle alternatives?',
          answer:
            'Two things: it is voice only, which removes the explicit-content problem that made Omegle hard to run; and it lets you call a good match back later from your call history, which none of the mainstream video alternatives offer.',
        },
      ]}
    />
  )
}
