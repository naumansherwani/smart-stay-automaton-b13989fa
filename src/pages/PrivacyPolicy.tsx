import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 15, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
          <p>HostFlow AI Technologies ("we," "us," or "our") operates the HostFlow AI platform at hostflowai.net. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. By using HostFlow AI, you consent to the practices described herein.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-white/90">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full name and email address</li>
            <li>Company/business name and industry type</li>
            <li>Phone number and business address</li>
            <li>Payment and billing information (processed securely by our authorized payment provider)</li>
            <li>Profile photos and avatars</li>
          </ul>
          <h3 className="text-lg font-medium text-white/90">2.2 Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Booking and scheduling data you create</li>
            <li>CRM contacts, deals, and activity logs</li>
            <li>AI feature interactions and preferences</li>
            <li>Browser type, IP address, device information</li>
            <li>Pages visited, time spent, and navigation patterns</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, operate, and maintain the HostFlow AI platform</li>
            <li>To personalize your dashboard, AI recommendations, and scheduling</li>
            <li>To process payments and manage subscriptions via our payment provider</li>
            <li>To send appointment reminders, booking confirmations, and service notifications</li>
            <li>To improve our AI algorithms, features, and platform performance</li>
            <li>To communicate important updates, security alerts, and policy changes</li>
            <li>To detect, prevent, and address fraud, security issues, and technical problems</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Payment Processing</h2>
          <p>All payment transactions are processed through our authorized payment provider, acting as Merchant of Record. The provider handles all payment data, tax collection, and invoicing on our behalf. We do not store your credit card numbers or payment credentials on our servers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption (AES-256 at rest, TLS 1.3 in transit). We use secure cloud infrastructure with row-level security policies ensuring your data is only accessible to you. We implement regular security audits, automated threat detection, and access monitoring.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. AI & Data Processing</h2>
          <p>Our AI features analyze your booking patterns, scheduling data, and industry trends to provide intelligent recommendations including dynamic pricing, auto-scheduling, and demand forecasting. This processing is done securely within our platform. Your data is never shared with other users, sold to third parties, or used for external AI model training.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Data Sharing & Third Parties</h2>
          <p>We do not sell, rent, or trade your personal information. We may share data only with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Payment processor:</strong> To process subscriptions and payments</li>
            <li><strong>Cloud infrastructure providers:</strong> To host and deliver our services</li>
            <li><strong>Analytics services:</strong> Aggregated, anonymized data to improve our platform</li>
            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Cookies & Tracking</h2>
          <p>We use essential cookies for authentication and session management. Analytics cookies help us understand usage patterns. You can manage cookie preferences through your browser settings. Our platform includes a cookie consent banner for compliance.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Your Rights (GDPR & CCPA)</h2>
          <p>Depending on your jurisdiction, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your account and data ("Right to be Forgotten")</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Objection:</strong> Object to data processing for certain purposes</li>
            <li><strong>Withdraw Consent:</strong> Opt out of non-essential communications at any time</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:privacy@hostflowai.com" className="text-primary hover:underline">privacy@hostflowai.com</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, financial records). Anonymized and aggregated data may be retained indefinitely for analytics.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">11. International Data Transfers</h2>
          <p>Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) where applicable, to protect your data in compliance with GDPR and other regulations.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">12. Children's Privacy</h2>
          <p>HostFlow AI is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">13. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Your continued use after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">14. Contact Us</h2>
          <p>For privacy-related inquiries or to exercise your data rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email: <a href="mailto:contact@hostflowai.net" className="text-primary hover:underline">contact@hostflowai.net</a></li>
            <li>Website: <a href="https://hostflowai.net" className="text-primary hover:underline">hostflowai.net</a></li>
          </ul>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
