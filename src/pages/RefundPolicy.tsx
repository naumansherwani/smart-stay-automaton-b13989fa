import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const RefundPolicy = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 15, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Free Trial</h2>
          <p>All HostFlow AI plans include a 7-day free trial. During the trial period, you will not be charged. You may cancel at any time before the trial ends without any obligation or cost.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Subscription Payments</h2>
          <p>After the free trial, your selected plan (Basic, Pro, or Premium) will be billed monthly. All payments are processed securely through our payment provider.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Refund Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>If you are unsatisfied with the service, you may request a full refund within <strong>7 days</strong> of your first paid subscription charge.</li>
            <li>Refund requests made after the 7-day window will be reviewed on a case-by-case basis.</li>
            <li>Refunds are not available for partial months of usage.</li>
            <li>If you downgrade or cancel your plan, your access continues until the end of the current billing period.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. How to Request a Refund</h2>
          <p>To request a refund, please contact our support team at <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a> with the following details:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your registered email address</li>
            <li>Plan name and date of purchase</li>
            <li>Reason for the refund request</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Processing Time</h2>
          <p>Approved refunds will be processed within 5–10 business days. The refund will be credited back to the original payment method used during the transaction.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Non-Refundable Items</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom AI training or dedicated account manager services already delivered</li>
            <li>Add-on workspace purchases after usage has begun</li>
            <li>Any third-party integrations or services activated through HostFlow AI</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Changes to This Policy</h2>
          <p>HostFlow AI Technologies reserves the right to modify this refund policy at any time. Changes will be posted on this page with an updated revision date.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
          <p>If you have any questions about this Refund Policy, please contact us at <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a>.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
