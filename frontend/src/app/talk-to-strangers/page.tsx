import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Talk to Strangers Online, Free',
  description:
    'Talk to strangers online by voice with no signup. Pokytalk connects you to a random person in seconds, with country and age filters and no account required.',
  path: '/talk-to-strangers',
})

export default function TalkToStrangersPage() {
  return (
    <LandingPage
      crumbName="Talk to strangers"
      path="/talk-to-strangers"
      h1="Talk to Strangers Online by Voice"
      intro="Pokytalk connects you with a random person somewhere in the world and lets you talk. It is voice only, it is free, and it takes no account. Press call, allow microphone access, and you are usually connected within a few seconds. If the conversation is not working, hang up and get someone new."
      sections={[
        {
          heading: 'Why talk to a stranger at all',
          paragraphs: [
            'Conversations with strangers have a quality that conversations with people you know often lack: no history and no stakes. Nobody is tracking what you said last week. That tends to make people more honest and more curious than they are with friends or colleagues.',
            'Research on what psychologists call minimal social interaction has repeatedly found that brief exchanges with strangers measurably lift mood, and that people consistently underestimate how much they will enjoy them beforehand. The barrier is almost always starting, not the conversation itself.',
            'There are practical reasons too. People use Pokytalk to practise a language with native speakers, to hear how something sounds to someone outside their own bubble, or simply to fill a quiet evening with a real voice instead of a feed.',
          ],
        },
        {
          heading: 'How it works',
          paragraphs: [
            'Optionally set an age range and pick the countries you want to be matched with. Then press call. Pokytalk puts you into a queue and pairs you with another person who is also waiting, avoiding anyone you have spoken to in the last couple of minutes so you do not get the same person twice in a row.',
            'Once connected you will see a call timer and audio level indicators for both sides, so you can tell whether your microphone is actually working. You can mute yourself, send text messages, or play a round of hangman if the conversation stalls.',
            'Either person can end the call at any time, with no explanation needed. That is a feature, not rudeness — it is what makes talking to strangers low risk.',
          ],
        },
        {
          heading: 'Talking to strangers safely',
          paragraphs: [
            'Stay anonymous. You are not asked for a name, an email address, or a phone number, and there is no good reason to volunteer them. Keep your surname, workplace, school, street, and financial details out of the conversation.',
            'Trust the hang-up button. If someone is aggressive, pushy about personal details, or asks you to move the conversation to another platform, end the call. You do not owe a stranger politeness at your own expense.',
            'Use report and block. Blocking prevents future matches with that person; reporting sends the incident to moderation. Both are available during every call.',
            'Pokytalk is for adults aged 18 and over.',
          ],
        },
        {
          heading: 'What to say first',
          paragraphs: [
            'Skip "hi" and ask something with somewhere to go. "Where are you calling from and what time is it there?" works almost every time, because it is easy to answer and it usually branches into weather, work, or what the person is doing that day.',
            'Ask about specifics rather than categories. "What are you listening to lately?" gets a real answer; "what music do you like?" gets a genre. If you want more, our blog has fifty conversation starters and a set of icebreakers for the awkward gaps.',
          ],
        },
        {
          heading: 'Where people talk to strangers online, and where voice fits',
          paragraphs: [
            'There is no single place to talk to strangers online — there are several, and they suit different moods. Community platforms like Discord and Reddit are built around shared interests, so the stranger you talk to already has something in common with you, but conversations are mostly text and mostly one-to-many. Video-roulette sites give you a live one-to-one connection with no filter on who shows up, which is fast but exposing.',
            'Random voice chat sits between the two. It is one-to-one and real-time like a video site, but without the camera, and it matches you instantly rather than asking you to join a server and wait for a thread to come alive. For a quick, low-commitment conversation with someone new, that combination is hard to beat.',
          ],
          list: [
            'Interest-based communities (Discord, Reddit, forums): good for depth, slow to start, rarely voice.',
            'Video roulette: instant and one-to-one, but appearance-first and harder to moderate.',
            'Random voice chat (Pokytalk): instant, one-to-one, anonymous, screen-free.',
          ],
        },
        {
          heading: 'Talking to strangers from other countries',
          paragraphs: [
            'One of the better reasons to talk to a stranger is that they live somewhere you do not. Pokytalk lets you pick one or more countries before you connect, so you can aim for a specific region — to practise a language with native speakers, to hear a local perspective on something in the news, or just out of curiosity about ordinary life somewhere else.',
            'Time zones are the main thing to plan around. If you want to reach a particular country, call when it is evening there rather than the middle of the night. If nobody from your selected countries is online, Pokytalk widens the search rather than leaving you waiting, so you may still be connected to someone elsewhere.',
          ],
        },
      ]}
      comparison={{
        heading: 'Ways to talk to strangers online, compared',
        intro:
          'The main options for talking to someone new online, and what each one is good and bad at.',
        columns: ['Pokytalk', 'Video roulette', 'Discord servers', 'Reddit threads'],
        rows: [
          {
            label: 'Real-time conversation',
            values: [true, true, 'Sometimes', false],
          },
          { label: 'One-to-one', values: [true, true, false, false] },
          { label: 'Voice', values: [true, 'With video', 'In voice channels', false] },
          { label: 'No account needed', values: [true, 'Usually', false, false] },
          { label: 'Matched in seconds', values: [true, true, false, false] },
          { label: 'Fully anonymous', values: [true, 'Usually', false, 'Pseudonymous'] },
          {
            label: 'Report / block tools',
            values: [true, 'Varies', 'Server mods', 'Subreddit mods'],
          },
        ],
      }}
      faqs={[
        {
          question: 'Is it really free to talk to strangers on Pokytalk?',
          answer:
            'Yes. There is no charge, no subscription, and no account. The site is funded by advertising.',
        },
        {
          question: 'Do I need to register or download anything?',
          answer:
            'No. Pokytalk runs in your browser. You only need to grant microphone permission when prompted.',
        },
        {
          question: 'Is it anonymous?',
          answer:
            'Yes. You are never asked for your real name, email address, or phone number, and calls are not recorded or stored.',
        },
        {
          question: 'What if I get matched with someone rude?',
          answer:
            'Hang up. You can also block them, which stops you being matched with them again, and report them so moderators can review the incident.',
        },
        {
          question: 'Can I talk to strangers from a specific country?',
          answer:
            'Yes. You can select one or more countries before you connect. If nobody from those countries is available, Pokytalk gradually widens the search instead of leaving you in the queue.',
        },
        {
          question: 'Can I talk to the same person again?',
          answer:
            'Yes. People you have spoken to appear in your call history, and you can send them a call-back request later. If you both request each other, the call connects automatically.',
        },
        {
          question: 'Is it safe to talk to strangers online?',
          answer:
            'It is low risk if you stay anonymous and keep personal details out of the conversation. Pokytalk never asks for your name, email, or phone number, does not record calls, and gives you report, block, and hang-up controls on every call. The main rule is simple: do not share your surname, address, workplace, school, or financial information with someone you just met.',
        },
        {
          question: 'What can I talk about with a stranger?',
          answer:
            'Where they are and what time it is there, what they are listening to or watching lately, what their day has been like, how something in the news looks from where they live. Specific questions work better than broad ones. Our blog has longer lists of conversation starters and icebreakers.',
        },
        {
          question: 'Do I have to use my real voice?',
          answer:
            'You use your own microphone, but you are never asked to identify yourself and calls are not recorded. If you would rather not speak at all for part of a call, there is a text sidebar.',
        },
      ]}
    />
  )
}
