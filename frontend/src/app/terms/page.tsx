'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary-400 hover:text-primary-300 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Last Updated: {new Date().toLocaleDateString()}</h2>
            <p>
              By using Pokytalk, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Description</h2>
            <p>
              Pokytalk is an anonymous voice chat service that connects users for real-time voice conversations. Users are matched randomly based on optional filters such as country preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">User Conduct</h2>
            <p className="mb-4">You agree to use our service responsibly and in accordance with all applicable laws. You must not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Harass, abuse, threaten, or harm other users</li>
              <li>Share illegal, offensive, or inappropriate content</li>
              <li>Impersonate others or provide false information</li>
              <li>Attempt to hack, disrupt, or interfere with our service</li>
              <li>Use automated systems or bots to access our service</li>
              <li>Record or distribute conversations without consent</li>
              <li>Spam or send unsolicited messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Age Requirement</h2>
            <p>
              You must be at least 13 years old to use Pokytalk. Users under 18 should have parental permission. We reserve the right to verify age and terminate accounts of users who do not meet age requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Privacy and Anonymity</h2>
            <p>
              While Pokytalk provides anonymous connections, you are responsible for protecting your own privacy. Do not share personal information such as your real name, address, phone number, or financial information with other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Content Moderation</h2>
            <p>
              We reserve the right to monitor, review, and remove content that violates these terms. We may suspend or terminate accounts that engage in prohibited behavior. However, we cannot monitor all conversations in real-time, so users should report violations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
            <p>
              We strive to provide a reliable service but do not guarantee uninterrupted or error-free operation. We may temporarily suspend the service for maintenance, updates, or due to technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
            <p>
              All content, features, and functionality of Pokytalk are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our service without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <p>
              Pokytalk is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to interactions with other users, technical issues, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Pokytalk at any time, with or without cause, for violations of these terms or for any other reason we deem necessary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at: <a href="mailto:legal@pokytalk.com" className="text-primary-400 hover:text-primary-300">legal@pokytalk.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

