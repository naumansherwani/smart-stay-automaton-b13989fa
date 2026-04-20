import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const RefundPolicy = () => (
  <div className="min-h-screen bg-[hsl(222,47%,11%)]">
    <Navbar />
    <main className="container pt-24 pb-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-[hsl(213,97%,87%)]/80">
        <p className="text-sm text-muted-foreground">Last updated: April 20, 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">30-Day Money-Back Guarantee</h2>
          <p>HostFlow AI is a software-only SaaS product. We offer a <strong>30-day money-back guarantee</strong>. If you are not satisfied with your subscription, you can request a full refund within 30 days of your initial paid subscription charge.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Free Trial</h2>
          <p>All plans include a 7-day free trial. You will not be charged during the trial. No credit card is required to start.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">How to Request a Refund</h2>
          <p>Refunds are processed by our payment provider, Paddle. To request a refund, visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">paddle.net</a> or contact our support team at <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Cancellation</h2>
          <p>You can cancel your subscription at any time. After cancellation, your access continues until the end of the current billing period.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>Email: <a href="mailto:support@hostflowai.com" className="text-primary hover:underline">support@hostflowai.com</a></p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
