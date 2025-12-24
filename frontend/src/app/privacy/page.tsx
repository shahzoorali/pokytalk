'use client'

import Link from 'next/link'
import { AdSense } from '@/components/AdSense'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary-400 hover:text-primary-300 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Last Updated: {new Date().toLocaleDateString()}</h2>
            <p>
              This Privacy Policy describes how Pokytalk ("we", "our", or "us") collects, uses, and protects your information when you use our anonymous voice and text chat service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Age Requirement</h2>
            <p className="text-red-400 font-semibold mb-2">
              ⚠️ This service is for users 18 years of age and older only.
            </p>
            <p>
              We do not knowingly collect information from users under 18. If you are under 18, please do not use this service. If you believe we have collected information from a user under 18, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Voice Data:</strong> We process your voice audio in real-time to facilitate voice chat connections. Audio is transmitted peer-to-peer using WebRTC encryption and is NOT stored on our servers. Conversations are not recorded by us.</li>
              <li><strong>IP Address:</strong> We collect your IP address to detect your country for matching purposes, ensure service security, and prevent abuse. We do not share your IP address with other users.</li>
              <li><strong>Connection Data:</strong> We store connection timestamps, session IDs, and basic connection metadata to maintain service quality and prevent abuse.</li>
              <li><strong>Text Messages:</strong> Chat messages sent during calls are temporarily stored in memory during the active session and are permanently deleted when the call ends. We do not retain chat history.</li>
              <li><strong>Country Information:</strong> We detect your country based on IP address for matching purposes. This information is not shared with other users in a way that identifies you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">⚠️ Privacy Warning</h2>
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-semibold mb-2">PROTECT YOUR PRIVACY:</p>
              <ul className="list-disc list-inside space-y-2 text-yellow-200">
                <li><strong>We do not verify user identities</strong> - anyone can create an account</li>
                <li><strong>Other users may record conversations</strong> - be careful what you share</li>
                <li><strong>Never share personal information</strong> - your real name, address, phone, email, social media, etc.</li>
                <li><strong>Never share photos or videos</strong> that could reveal your identity or location</li>
                <li><strong>Be cautious</strong> - people may not be who they claim to be</li>
                <li><strong>Report suspicious behavior</strong> if someone asks for personal information</li>
              </ul>
            </div>
            <p>
              You are responsible for protecting your own privacy. We cannot control what other users do with information you share during conversations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To match you with other users based on your preferences</li>
              <li>To provide and maintain our voice and text chat service</li>
              <li>To detect and prevent abuse, harassment, or fraudulent activity</li>
              <li>To improve our service and user experience</li>
              <li>To comply with legal obligations and respond to law enforcement requests</li>
              <li>To analyze service usage patterns (in anonymized, aggregated form)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your information. Voice conversations are transmitted peer-to-peer using WebRTC encryption and are not stored on our servers. We only store minimal connection metadata necessary for service operation. All data is stored securely and access is restricted to authorized personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p>
              We use Google AdSense to display advertisements on our website. Google may use cookies and similar technologies to serve ads based on your browsing behavior. You can opt out of personalized advertising by visiting Google's Ad Settings or using our cookie consent banner.
            </p>
            <p className="mt-2">
              We also use Google Analytics to understand how users interact with our website. This data is anonymized and aggregated. You can control this through our cookie consent settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              We use cookies to maintain your session, remember your preferences, and improve our service. We also use cookies for advertising and analytics purposes. You can control cookies through our cookie consent banner or your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing</h2>
            <p>
              We do not sell your personal information. We do not share your personal information with other users. We may share anonymized, aggregated data for analytics purposes. We may disclose information if required by law or to protect our rights and the safety of our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. Since we operate an anonymous service, we store minimal personal data. If you have concerns about your privacy or wish to exercise your rights, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">International Users</h2>
            <p>
              Pokytalk is available worldwide. If you are using our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to report a privacy concern, please contact us at: <a href="mailto:privacy@pokytalk.com" className="text-primary-400 hover:text-primary-300">privacy@pokytalk.com</a>
            </p>
          </section>
        </div>

        {/* AdSense Ad - Only on content-rich pages */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex justify-center">
            <AdSense 
              adSlot="YOUR_PRIVACY_PAGE_AD_SLOT_ID"
              adFormat="auto"
              fullWidthResponsive={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
