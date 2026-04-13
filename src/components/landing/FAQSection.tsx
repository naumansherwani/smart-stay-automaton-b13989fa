import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is my data safe with HostFlow AI?",
    a: "Absolutely. We use 256-bit encryption, row-level security policies, and privacy-first data handling. Your data is isolated and never shared with other users or used for AI training."
  },
  {
    q: "How does the 7-day free trial work?",
    a: "You get full access to all features for 7 days — no credit card required. After the trial, choose a plan that fits your business. You can cancel anytime."
  },
  {
    q: "What plans are available?",
    a: "We offer 3 plans: Basic ($25/mo) for solo operators, Pro ($55/mo) for growing businesses, and Premium ($110/mo) for advanced AI operations. All plans include a 7-day free trial."
  },
  {
    q: "What is the AI CRM?",
    a: "The AI CRM is a Premium feature that helps you manage contacts, deals, tickets, and activities with AI-powered insights — all integrated with your scheduling workflow."
  },
  {
    q: "Can I use HostFlow for multiple industries?",
    a: "Each plan supports 1 industry. You can switch between industries anytime from your dashboard. Need multiple industries? Contact us for custom enterprise pricing."
  },
  {
    q: "How accurate is the AI pricing engine?",
    a: "Our AI analyzes demand patterns, competitor pricing, seasonality, and capacity to optimize your rates. Available for Hospitality, Airlines, Car Rental, Events & Railways. Customers report an average 34% revenue increase within the first month."
  },
  {
    q: "What happens if the AI makes a mistake?",
    a: "You always have full control. Every AI recommendation can be overridden. The AI learns from your corrections to improve future suggestions."
  },
  {
    q: "Do you support integrations?",
    a: "Yes! We sync with major booking platforms, calendar apps, and payment processors. Our API is available on Premium plans for custom integrations."
  },
];

const FAQSection = () => (
  <section className="py-24 bg-background">
    <div className="container max-w-3xl space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
          <HelpCircle className="w-4 h-4" /> FAQ
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">Everything you need to know about HostFlow AI.</p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-5 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/[0.02] transition-all">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary py-5 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
