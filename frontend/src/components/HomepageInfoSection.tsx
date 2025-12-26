'use client'

import { Mic, Globe, Users, Heart } from 'lucide-react'

export function HomepageInfoSection() {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-xl space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
          Talk to Strangers, Spread Good Vibes! 🔊
        </h2>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
          Tired of endless scrolling and shallow interactions? Pokytalk lets you connect instantly with strangers around the world through real-time, voice-only conversations.
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="w-5 h-5 text-primary-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white">No Registration</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            No sign-ups, no profiles, no distractions – just your voice and someone else's.
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-5 h-5 text-primary-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Global Connections</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Connect with people from around the world and discover new cultures, languages, and perspectives.
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-primary-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Authentic Chats</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time voice conversations create deeper, more meaningful connections than text ever could.
          </p>
        </div>
      </div>

      {/* Main Value Proposition */}
      <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 rounded-lg p-4 sm:p-6 border border-primary-700/30">
        <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
          Whether you're looking to make new friends, practice a language, or simply enjoy a meaningful chat with someone anonymous, Pokytalk creates a space for authentic human connection, without the pressure of social media perfection.
        </p>
      </div>

      {/* Communication Guidelines */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
          <span>Communication Guidelines</span>
        </h3>
        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold text-base sm:text-lg">18+</span>
            <p>Be at least over 18. We're serious about keeping this space safe and mature.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">👋</span>
            <p><strong>Greet people politely.</strong> A simple "hey" or "hello" goes a long way in starting a good conversation.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">💬</span>
            <p><strong>Introduce yourself</strong> (but don't give out personal info). Share your interests, not your address.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">😊</span>
            <p><strong>Be friendly and approachable.</strong> Good vibes attract good vibes.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">👂</span>
            <p><strong>Listen to people.</strong> Great conversations are a two-way street.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">✨</span>
            <p><strong>Be genuine.</strong> Authenticity creates the best connections.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">⚠️</span>
            <p><strong>Use caution.</strong> Trust your instincts and report anything that makes you uncomfortable.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">💭</span>
            <p><strong>Engage in meaningful conversation.</strong> Skip the small talk and dive into real topics.</p>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-primary-400 font-bold">🔄</span>
            <p><strong>Don't take it personally</strong> if others decline your call. Everyone's looking for different vibes.</p>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-700/50">
          <p className="text-xs text-gray-400">
            Improper use of the service, including sexual statements, offensive, or violent behavior, will result in an irrevocable ban.
          </p>
        </div>
      </div>
    </div>
  )
}

