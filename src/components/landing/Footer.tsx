import Logo from "@/components/Logo";
import { Mail, Phone, Linkedin, Facebook } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIAL_LINKS = [
  { href: "mailto:contact@hostflowai.live", icon: Mail, label: "contact@hostflowai.live" },
  { href: "https://instagram.com/hostflowai", icon: InstagramIcon, label: "Instagram" },
  { href: "https://wa.me/923001234567", icon: Phone, label: "WhatsApp" },
  { href: "https://facebook.com/hostflowai", icon: Facebook, label: "Facebook" },
  { href: "https://x.com/hostflowai", icon: XIcon, label: "X (Twitter)" },
  { href: "https://linkedin.com/company/hostflowai", icon: Linkedin, label: "LinkedIn" },
];

const Footer = () => (
  <footer className="py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-[hsl(222,47%,6%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(174,62%,50%,0.03),transparent_60%)]" />
    
    <div className="container relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <Logo size="md" showName />
          <p className="text-sm text-white/40 leading-relaxed">
            AI-powered scheduling, marketplace & booking platform built for 8 industries. Smarter calendars, zero conflicts, maximum revenue.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Product</h4>
          <ul className="space-y-2.5">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "/marketplace", label: "Marketplace" },
              { href: "#industries", label: "Industries" },
            ].map(link => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Legal</h4>
          <ul className="space-y-2.5">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
            ].map(link => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/80">Connect</h4>
          <ul className="space-y-2.5">
            {SOCIAL_LINKS.map(s => (
              <li key={s.label}>
                <a href={s.href} target={s.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-white/40 hover:text-[hsl(174,62%,50%)] transition-colors duration-300">
                  <s.icon className="w-4 h-4" /> {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-white/30">© 2026 HostFlow AI. All rights reserved.</p>
        <p className="text-xs text-white/30">Powered by AI · Built for every industry · Made with ❤️</p>
      </div>
    </div>
  </footer>
);

export default Footer;
