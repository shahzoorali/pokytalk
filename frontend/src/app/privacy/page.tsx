'use client'

import Link from 'next/link'

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
              This Privacy Policy describes how Pokytalk ("we", "our", or "us") collects, uses, and protects your information when you use our voice chat service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Voice Data:</strong> We process your voice audio in real-time to facilitate voice chat connections. Audio is transmitted peer-to-peer and is not stored on our servers.</li>
              <li><strong>IP Address:</strong> We collect your IP address to detect your country for matching purposes and to ensure service security.</li>
              <li><strong>Connection Data:</strong> We store connection timestamps and session information to maintain service quality.</li>
              <li><strong>Text Messages:</strong> Chat messages sent during calls are temporarily stored during the session and deleted when the call ends.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To match you with other users based on your preferences</li>
              <li>To provide and maintain our voice chat service</li>
              <li>To detect and prevent abuse or fraudulent activity</li>
              <li>To improve our service and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your information. Voice conversations are transmitted peer-to-peer using WebRTC encryption and are not stored on our servers. We only store minimal connection metadata necessary for service operation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p>
              We use Google AdSense to display advertisements on our website. Google may use cookies and similar technologies to serve ads based on your browsing behavior. You can opt out of personalized advertising by visiting Google's Ad Settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              We use cookies to maintain your session, remember your preferences, and improve our service. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. Since we operate an anonymous service, we store minimal personal data. If you have concerns about your privacy, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
            <p>
              Our service is not intended for users under the age of 13. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
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
              If you have questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@pokytalk.com" className="text-primary-400 hover:text-primary-300">privacy@pokytalk.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

