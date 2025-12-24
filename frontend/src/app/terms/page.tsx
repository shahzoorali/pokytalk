'use client'

import Link from 'next/link'
import { AdSense } from '@/components/AdSense'

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
            <h2 className="text-2xl font-semibold text-white mb-4">Age Requirement</h2>
            <p className="text-red-400 font-semibold mb-2">
              ⚠️ You must be at least 18 years old to use Pokytalk.
            </p>
            <p>
              This service is strictly for adults only. By using Pokytalk, you represent and warrant that you are at least 18 years of age. We reserve the right to verify age and immediately terminate accounts of users who do not meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Description</h2>
            <p>
              Pokytalk is an anonymous voice and text chat service that connects users worldwide for real-time conversations. Users are matched randomly based on optional filters such as country preferences. All connections are anonymous - we do not share personal information between users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">⚠️ Online Safety Warning</h2>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
              <p className="text-red-300 font-semibold mb-2">IMPORTANT SAFETY INFORMATION:</p>
              <ul className="list-disc list-inside space-y-2 text-red-200">
                <li><strong>Never share personal information</strong> such as your real name, address, phone number, email, social media accounts, or financial information</li>
                <li><strong>Never share photos or videos</strong> that could reveal your identity or location</li>
                <li><strong>Never agree to meet in person</strong> with someone you met on Pokytalk</li>
                <li><strong>Never send money</strong> or provide financial assistance to other users</li>
                <li><strong>Be cautious</strong> - not everyone online is who they claim to be</li>
                <li><strong>Report suspicious behavior</strong> immediately if someone asks for personal information or makes you uncomfortable</li>
                <li><strong>Protect your privacy</strong> - what you share in conversations can be recorded or shared by others</li>
              </ul>
            </div>
            <p>
              You are solely responsible for your safety and privacy when using this service. We cannot guarantee the identity or intentions of other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">User Conduct</h2>
            <p className="mb-4">You agree to use our service responsibly and in accordance with all applicable laws. You must not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Harass, abuse, threaten, intimidate, or harm other users in any way</li>
              <li>Share illegal, offensive, discriminatory, or inappropriate content</li>
              <li>Impersonate others or provide false information</li>
              <li>Attempt to hack, disrupt, or interfere with our service or other users' connections</li>
              <li>Use automated systems, bots, or scripts to access our service</li>
              <li>Record, distribute, or share conversations without explicit consent from all participants</li>
              <li>Spam, send unsolicited messages, or engage in commercial activities</li>
              <li>Share content that violates intellectual property rights</li>
              <li>Engage in any form of sexual harassment or inappropriate sexual behavior</li>
              <li>Share content related to violence, self-harm, or illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Privacy and Anonymity</h2>
            <p>
              While Pokytalk provides anonymous connections, you are responsible for protecting your own privacy. Do not share personal information such as your real name, address, phone number, email, social media handles, workplace, school, or any other identifying details. We are not responsible for any consequences resulting from information you choose to share with other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Content Moderation</h2>
            <p>
              We reserve the right to monitor, review, and remove content that violates these terms. We may suspend or terminate accounts that engage in prohibited behavior. However, we cannot monitor all conversations in real-time, so users should report violations immediately. We rely on user reports and automated systems to identify and address violations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
            <p>
              We strive to provide a reliable service but do not guarantee uninterrupted or error-free operation. We may temporarily suspend the service for maintenance, updates, or due to technical issues. We are not liable for any loss or inconvenience resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
            <p>
              All content, features, and functionality of Pokytalk are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works of our service without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <p>
              Pokytalk is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Interactions with other users</li>
              <li>Sharing of personal information by users</li>
              <li>Technical issues or service interruptions</li>
              <li>Content shared by other users</li>
              <li>Any harm resulting from meeting someone in person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Pokytalk at any time, with or without cause, for violations of these terms or for any other reason we deem necessary to protect our users or service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p>
              If you have questions about these Terms of Service or need to report violations, please contact us at: <a href="mailto:legal@pokytalk.com" className="text-primary-400 hover:text-primary-300">legal@pokytalk.com</a>
            </p>
          </section>
        </div>

        {/* AdSense Ad - Only on content-rich pages */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex justify-center">
            <AdSense 
              adSlot="YOUR_TERMS_PAGE_AD_SLOT_ID"
              adFormat="auto"
              fullWidthResponsive={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
