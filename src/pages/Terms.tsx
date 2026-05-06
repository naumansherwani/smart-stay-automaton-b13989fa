import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Terms = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 15, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using HostFlow AI, a product of HostFlow AI Technologies ("the Platform," "we," "us"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Platform.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
          <p>HostFlow AI is a <strong>software-only, self-service SaaS platform</strong> providing AI-powered scheduling, booking management, CRM, and dynamic pricing tools. It serves multiple industries including hospitality, airlines, car rental, healthcare, education, logistics, events & entertainment, travel agencies, and railways.</p>
          <p><strong>This is a software product only.</strong> All features are fully automated and AI-powered. No human-driven services, manual work, consulting, done-for-you setup, or agency-style services are included in any plan. Customers access and use the platform on a self-service basis.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate, current, and complete information during registration</li>
            <li>You are responsible for maintaining the confidentiality and security of your account credentials</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One individual may not maintain more than one account</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized access or security breach</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Subscription Plans & Pricing</h2>
          <p>HostFlow AI offers the following subscription plans:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Basic Plan — £25/month:</strong> 1 industry workspace, up to 100 CRM contacts, up to 50 bookings/month, limited AI features, basic analytics</li>
            <li><strong>Pro Plan — £52/month:</strong> 1 industry workspace, unlimited contacts and bookings, AI scheduling, AI follow-ups, client scoring, advanced analytics, priority support</li>
            <li><strong>Premium Plan — £108/month:</strong> 1 industry workspace, full AI CRM suite, AI Voice Assistant, deal pipeline, Google Workspace integration, priority email support</li>
          </ul>
          <p>Additional industry workspaces can be purchased as add-ons. All plans include a 7-day free trial. Prices are in GBP (£) — our master currency — and exclude applicable taxes, which are calculated and collected by our payment provider. Customers may view equivalent pricing in USD, EUR, CHF, KWD, or PKR via the on-site currency switcher; billing is processed in GBP.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Payments & Billing</h2>
          <p>All payments are securely processed by our authorized payment provider, acting as Merchant of Record. The provider is responsible for payment processing, tax calculation, collection, and remittance, as well as issuing invoices and receipts.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Subscriptions are billed on a monthly recurring basis</li>
            <li>Your subscription renews automatically unless cancelled before the renewal date</li>
            <li>Your payment method on file will be charged for each renewal</li>
            <li>All applicable taxes (VAT, GST, sales tax) are added at checkout</li>
            <li>Invoices and receipts are provided for each transaction</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Free Trial</h2>
          <p>New users receive a 7-day free trial with access to trial-level features. No payment is required during the trial. If you do not subscribe to a paid plan before the trial expires, your access will be limited. You will not be charged automatically at the end of the trial.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Cancellation & Refunds</h2>
          <p>You may cancel your subscription at any time. Upon cancellation, your access continues until the end of the current billing period. Refund eligibility is governed by our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>. Refund requests are processed through our authorized payment provider.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. AI Features Disclaimer</h2>
          <p>HostFlow AI's artificial intelligence features — including auto-scheduling, dynamic pricing, demand forecasting, lead scoring, and AI recommendations — are provided as decision-support tools. You maintain full control over all business decisions and can override any AI suggestion. We do not guarantee specific revenue outcomes, scheduling accuracy, or business results from using AI features.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Data Ownership & Intellectual Property</h2>
          <p>You retain full ownership of all data you input into the Platform, including booking data, customer information, CRM records, and business documents. We do not claim any intellectual property rights over your content. HostFlow AI, its logo, design, and underlying technology are the intellectual property of HostFlow AI Technologies.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Platform for any unlawful purpose or activity</li>
            <li>Attempt unauthorized access to any part of the Platform or its infrastructure</li>
            <li>Scrape, crawl, or extract data from the Platform by automated means</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            <li>Interfere with or disrupt the integrity or performance of the Platform</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Resell, sublicense, or redistribute access to the Platform without permission</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">11. Service Availability</h2>
          <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with advance notice. We are not liable for downtime caused by factors beyond our control, including but not limited to internet outages, third-party service failures, or force majeure events.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">12. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, HostFlow AI Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use the Platform. Our total aggregate liability shall not exceed the total amount paid by you to us in the 12 months preceding the claim.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">13. Indemnification</h2>
          <p>You agree to indemnify and hold harmless HostFlow AI Technologies, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Platform or violation of these Terms.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">14. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose a security risk. Upon termination, your right to use the Platform ceases immediately. You may request export of your data within 30 days of termination.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">15. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">16. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be notified via email or a prominent notice on the Platform at least 30 days before taking effect. Continued use after changes constitutes acceptance.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">17. Contact Us</h2>
          <p>For questions about these Terms & Conditions:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email: <a href="mailto:legal@hostflowai.com" className="text-primary hover:underline">legal@hostflowai.com</a></li>
            <li>Support: <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a></li>
            <li>Website: <a href="https://hostflowai.net" className="text-primary hover:underline">hostflowai.net</a></li>
          </ul>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
