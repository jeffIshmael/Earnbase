import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                EarnBase is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform that connects task creators with participants through blockchain technology and WhatsApp notifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Wallet addresses (blockchain identifiers)</li>
                <li>Contact information (email addresses, phone numbers for WhatsApp notifications)</li>
                <li>Task responses and submissions</li>
                <li>AI-generated ratings and feedback</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Facilitate task creation and participation</li>
                <li>Process payments and rewards through blockchain technology</li>
                <li>Send WhatsApp notifications to task creators about responses</li>
                <li>Generate AI ratings for task submissions</li>
                <li>Improve our platform and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. WhatsApp Integration</h2>
              <p className="text-gray-700 mb-4">
                We use WhatsApp Business API to send notifications to task creators when participants submit responses. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Sending task response notifications via WhatsApp</li>
                <li>Including participant information (truncated wallet addresses)</li>
                <li>Sharing AI ratings and reward information</li>
                <li>Transmitting task response content</li>
              </ul>
              <p className="text-gray-700 mb-4">
                By providing your WhatsApp number, you consent to receive these notifications. You can opt out by changing your contact preferences in your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Blockchain and Cryptocurrency</h2>
              <p className="text-gray-700 mb-4">
                Our platform operates on blockchain technology (Celo network) and uses cryptocurrency (cUSD) for payments. Please note:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Blockchain transactions are public and permanent</li>
                <li>Wallet addresses may be visible on the blockchain</li>
                <li>We do not control or store your private keys</li>
                <li>Cryptocurrency transactions are irreversible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>With task creators (via WhatsApp notifications) when you submit responses</li>
                <li>With service providers who assist in platform operations</li>
                <li>When required by law or legal process</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of sensitive data</li>
                <li>Secure API communications</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Opt out of WhatsApp notifications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> earnbase601@gmail.com<br/>
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and will remain in effect except with respect to any changes in its provisions in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
