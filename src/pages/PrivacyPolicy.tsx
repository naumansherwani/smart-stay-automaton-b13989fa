import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 9, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, company name, phone number, and industry type when you create an account. We also collect booking data, scheduling preferences, and usage analytics to improve our services.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our AI scheduling platform</li>
            <li>To personalize your dashboard and AI recommendations</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send appointment reminders and booking confirmations</li>
            <li>To improve our AI algorithms and platform performance</li>
            <li>To communicate important updates about our service</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption. We use secure cloud infrastructure with row-level security policies ensuring your data is only accessible to you. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. AI & Data Processing</h2>
          <p>Our AI features analyze your booking patterns, scheduling data, and industry trends to provide intelligent recommendations. This processing is done securely and your data is never shared with other users or external AI training datasets.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Cookies & Tracking</h2>
          <p>We use essential cookies for authentication and session management. We may use analytics cookies to understand platform usage. You can control cookie preferences through your browser settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and download your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of non-essential communications</li>
            <li>Export your booking and scheduling data</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, we remove your personal data within 30 days, except where required by law.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
          <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@hostflow.ai" className="text-primary hover:underline">privacy@hostflow.ai</a>.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
