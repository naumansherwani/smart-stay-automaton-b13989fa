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
          <p>All HostFlow AI plans include a 7-day free trial. During the trial period, you will not be charged. You may cancel at any time before the trial ends without any obligation or cost. No credit card is required to start a trial.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Subscription Payments</h2>
          <p>After the free trial, your selected plan (Basic at $25/mo, Pro at $55/mo, or Premium at $110/mo) will be billed monthly. All payments are processed securely through Paddle.com Market Limited ("Paddle"), our Merchant of Record. Paddle handles payment processing, tax collection, and invoicing.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Refund Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>If you are unsatisfied with the service, you may request a <strong>full refund within 14 days</strong> of your first paid subscription charge.</li>
            <li>Refund requests made after the 14-day window will be reviewed on a case-by-case basis.</li>
            <li>Refunds are not available for partial months of usage after the refund window.</li>
            <li>If you downgrade or cancel your plan, your access continues until the end of the current billing period. No prorated refunds are issued for early cancellation.</li>
            <li>Subsequent monthly renewals are non-refundable, except where required by law.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. How to Request a Refund</h2>
          <p>To request a refund, please contact our support team at <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a> with the following details:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your registered email address</li>
            <li>Plan name and date of purchase</li>
            <li>Paddle transaction/order ID (found in your payment receipt)</li>
            <li>Reason for the refund request</li>
          </ul>
          <p>Refund requests are processed through Paddle. You may also contact Paddle directly for billing inquiries.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Processing Time</h2>
          <p>Approved refunds will be processed within 5–10 business days. The refund will be credited back to the original payment method used during the transaction. Processing time may vary depending on your bank or payment provider.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Non-Refundable Items</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom AI training or dedicated account manager services already delivered</li>
            <li>Add-on workspace purchases after usage has begun</li>
            <li>Any third-party integrations or services activated through HostFlow AI</li>
            <li>Subscription fees for billing periods that have already elapsed</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Chargebacks & Disputes</h2>
          <p>If you believe a charge is incorrect, please contact us at <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a> before initiating a chargeback with your bank. We are committed to resolving billing issues quickly and fairly. Unauthorized chargebacks may result in account suspension.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Currency & Taxes</h2>
          <p>All prices are listed in USD. Applicable taxes (VAT, GST, sales tax) are calculated and collected by Paddle at checkout based on your location. Refunds include any taxes that were originally charged.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Changes to This Policy</h2>
          <p>HostFlow AI Technologies reserves the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated revision date. Material changes will be communicated via email.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact Us</h2>
          <p>If you have any questions about this Refund Policy:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email: <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a></li>
            <li>Website: <a href="https://hostflowai.live" className="text-primary hover:underline">hostflowai.live</a></li>
          </ul>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
