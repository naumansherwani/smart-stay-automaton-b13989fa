import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const RefundPolicy = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 23, 2026</p>

        <section className="space-y-3">
          <p>HostFlow AI Technologies offers digital software subscriptions and instant access services. Because our service activates immediately, the following fair-use refund terms apply:</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7-Day Refund Window (First-Time Customers)</h2>
          <p>A <strong>7-day refund window</strong> is available for first-time customers only. Refund requests must be submitted within 7 days of your <strong>first purchase</strong> of any HostFlow AI subscription.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">What Is Not Refundable</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Subscription <strong>renewals</strong> (monthly or annual)</li>
            <li><strong>Upgrade charges</strong> or partial-month fees</li>
            <li><strong>Misuse, abuse, excessive usage</strong>, or violation of our Terms of Service</li>
            <li><strong>Change of mind</strong> after active usage of paid features</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Duplicate or Accidental Charges</h2>
          <p>Duplicate charges or accidental billing issues will be reviewed fairly and resolved promptly when verified.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Technical Issues</h2>
          <p>If a technical issue prevents access to the service and our team cannot resolve it within a reasonable time, we may issue a refund at our discretion.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Free Trial</h2>
          <p>All plans include a 7-day free trial. You will not be charged during the trial. No credit card is required to start.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Cancellation</h2>
          <p>You can cancel your subscription at any time. After cancellation, your access continues until the end of the current billing period — no further charges will be made.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Chargeback Policy</h2>
          <p>Chargeback abuse — including disputes filed without first contacting our support team — may result in immediate account suspension. We strongly encourage all users to <strong>contact support first</strong> for the fastest resolution.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>Email: <a href="mailto:support@hostflowai.net" className="text-primary hover:underline">support@hostflowai.net</a></p>
          <p className="text-xs text-muted-foreground">We aim to respond to refund requests within 1 business day.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
