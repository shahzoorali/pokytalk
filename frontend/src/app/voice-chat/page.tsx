import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Random Voice Chat with Strangers',
  description:
    'Free random voice chat in your browser. Get matched with a stranger and talk instantly — no signup, no video, no download. Filter by country and age.',
  path: '/voice-chat',
})

export default function VoiceChatPage() {
  return (
    <LandingPage
      crumbName="Voice chat"
      path="/voice-chat"
      h1="Random Voice Chat, Straight From Your Browser"
      intro="Random voice chat pairs you with a stranger for an audio conversation. No profile, no camera, no download — just a microphone and whatever you feel like talking about. Pokytalk is free, matches you in seconds, and lets either person hang up whenever they like."
      sections={[
        {
          heading: 'What random voice chat actually is',
          paragraphs: [
            'You join a queue, the service pairs you with another person who is also waiting, and the two of you get a live audio connection. Neither of you knows anything about the other beforehand. When the call ends, you go back to the queue if you want someone new.',
            'The audio travels directly between the two browsers using WebRTC, the same technology behind most browser video calls. That means the conversation does not sit on a server waiting to be listened to later. Pokytalk handles the introduction; the call itself is peer to peer.',
          ],
        },
        {
          heading: 'Why voice instead of video or text',
          paragraphs: [
            'Voice carries most of what text loses. Tone, hesitation, and laughter are the difference between a message that reads as sarcastic and one that reads as cruel, and they arrive for free when you can hear someone. Conversations move faster too — talking is roughly three times quicker than typing.',
            'Compared to video, voice is less exposing and much less intimidating. You do not have to think about your background, your hair, or your camera angle, and you cannot be judged on appearance in the first half second. For a lot of people that is the difference between joining a conversation and closing the tab.',
            'It is also lighter. Audio uses a fraction of the bandwidth of video, so random voice chat works on a slow connection or a phone plan where video would stutter.',
          ],
        },
        {
          heading: 'Features',
          paragraphs: [
            'Country and age filters let you narrow who you are matched with before connecting. If nobody fits, the search widens rather than stranding you in the queue.',
            'A live audio level indicator for both sides tells you immediately whether your microphone is working and whether the other person can be heard — which resolves most of the "hello? can you hear me?" opening.',
            'A text sidebar handles anything awkward to say out loud, like spelling a name or sharing a link. A built-in hangman game gives you something to do when a conversation runs out of steam. And call history plus call-back means a good conversation does not have to be a one-off.',
          ],
        },
        {
          heading: 'Getting your microphone working',
          paragraphs: [
            'Your browser will ask for microphone permission the first time you call. If you dismissed that prompt, click the padlock or camera icon in the address bar and allow microphone access for this site, then reload.',
            'If the other person cannot hear you, check that the correct input device is selected in your system sound settings — laptops with a headset plugged in often default to the wrong one. The audio level bar on your own side is the quickest way to confirm: if it does not move when you speak, the browser is not receiving your voice.',
            'Headphones are worth using. They prevent your speakers feeding back into your microphone, which is the usual cause of echo that the other person hears but you do not.',
          ],
        },
      ]}
      faqs={[
        {
          question: 'Do I need to download an app for voice chat?',
          answer:
            'No. Pokytalk runs entirely in your browser on desktop and mobile. There is nothing to install.',
        },
        {
          question: 'Is random voice chat on Pokytalk free?',
          answer:
            'Yes, completely. There is no subscription, no credits, and no account. Advertising funds the site.',
        },
        {
          question: 'Is there video chat too?',
          answer:
            'No. Pokytalk is voice only by design, which keeps it lighter on bandwidth and far easier to keep free of explicit content.',
        },
        {
          question: 'Are my voice calls recorded?',
          answer:
            'No. Audio is transmitted directly between the two participants and is never recorded or stored on our servers.',
        },
        {
          question: 'Why can the other person not hear me?',
          answer:
            'Usually the browser lacks microphone permission or the wrong input device is selected. Check that the audio level bar on your side moves when you speak — if it does not, your browser is not picking up your microphone.',
        },
        {
          question: 'How long can a voice chat last?',
          answer:
            'There is no time limit. Calls last as long as both people stay on the line, and a timer shows the current call duration.',
        },
      ]}
    />
  )
}
