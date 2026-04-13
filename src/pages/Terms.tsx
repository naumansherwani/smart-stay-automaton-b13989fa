import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Terms = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 9, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p><p>By accessing or using HostFlow AI, a product of HostFlow AI Technologies ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Platform.</p>, you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Platform.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
          <p>HostFlow AI provides AI-powered scheduling, booking management, and dynamic pricing tools for multiple industries including hospitality, airlines, car rental, healthcare, education, logistics, and events & entertainment.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate and complete information during registration</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person may not maintain more than one account</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Subscriptions</h2>
          <p>To use the Platform, you must subscribe to a paid plan (Basic $15/mo, Standard $39/mo, or Premium $99/mo). Subscriptions are billed monthly and can be cancelled at any time.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. AI Features Disclaimer</h2>
          <p>Our AI-powered features (auto-scheduling, dynamic pricing, no-show prediction, etc.) are provided as recommendations. You maintain full control and can override any AI decision. We do not guarantee specific revenue outcomes from AI pricing suggestions.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Data Ownership</h2>
          <p>You retain full ownership of all data you input into the Platform. We do not claim any intellectual property rights over your booking data, customer information, or business records.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Acceptable Use</h2>
          <p>You agree not to misuse the Platform, including but not limited to: unauthorized access attempts, data scraping, reverse engineering, or using the Platform for illegal activities.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
          <p>HostFlow AI shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use the Platform. Our total liability shall not exceed the amount paid by you in the preceding 12 months.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may cancel your account at any time through your profile settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:legal@hostflow.ai" className="text-primary hover:underline">legal@hostflow.ai</a>.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
