import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is my data safe with HostFlow AI?",
    a: "Absolutely. We use 256-bit encryption, row-level security policies, and GDPR-compliant data handling. Your data is isolated and never shared with other users or used for AI training."
  },
  {
    q: "How does the 3-day free trial work?",
    a: "You get full access to all features for 3 days — no credit card required. After the trial, choose a plan that fits your business. You can cancel anytime."
  },
  {
    q: "Can I use HostFlow for multiple industries?",
    a: "Each plan supports 1 industry. You can switch between industries anytime from your dashboard. Need multiple industries? Contact us for custom enterprise pricing."
  },
  {
    q: "How accurate is the AI pricing engine?",
    a: "Our AI analyzes demand patterns, competitor pricing, seasonality, and capacity to optimize your rates. Customers report an average 34% revenue increase within the first month."
  },
  {
    q: "What happens if the AI makes a mistake?",
    a: "You always have full control. Every AI recommendation can be overridden. The AI learns from your corrections to improve future suggestions."
  },
  {
    q: "Do you support integrations with other platforms?",
    a: "Yes! We sync with major booking platforms, calendar apps, and payment processors. Our API is available on Premium plans for custom integrations."
  },
  {
    q: "Can I export or delete my data?",
    a: "Yes. You can export all your data anytime from your profile settings. For account deletion, we remove all personal data within 30 days as per our privacy policy."
  },
  {
    q: "Is there a mobile app?",
    a: "HostFlow AI is fully responsive and works beautifully on all devices. A dedicated mobile app is coming soon — join our waitlist!"
  },
];

const FAQSection = () => (
  <section className="py-20 bg-background">
    <div className="container max-w-3xl space-y-10">
      <div className="text-center space-y-4">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest">FAQ</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4 data-[state=open]:border-primary/30">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
