import Logo from "@/components/Logo";
import { Mail, Phone, Linkedin, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="py-16 bg-[hsl(222,47%,11%)] border-t border-[hsl(217,91%,60%)]/20">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Company Info */}
        <div className="space-y-4">
          <Logo size="md" showName />
          <p className="text-sm text-[hsl(213,97%,87%)]/70 leading-relaxed">
            AI-powered scheduling & booking platform built for 13+ industries. Smarter calendars, zero conflicts, maximum revenue.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Links</h4>
          <ul className="space-y-2">
            <li><a href="#features" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Features</a></li>
            <li><a href="#pricing" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Pricing</a></li>
            <li><a href="#industries" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Industries</a></li>
            <li><a href="mailto:contact@hostflow.ai" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Contact</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Legal</h4>
          <ul className="space-y-2">
            <li><a href="/privacy" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Privacy Policy</a></li>
            <li><a href="/terms" className="text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* Contact / Social */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Get in Touch</h4>
          <ul className="space-y-3">
            <li>
              <a href="mailto:contact@hostflow.ai" className="flex items-center gap-2 text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">
                <Mail className="w-4 h-4" /> contact@hostflow.ai
              </a>
            </li>
            <li>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </li>
            <li>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[hsl(213,97%,87%)]/70 hover:text-[hsl(174,62%,50%)] hover:drop-shadow-[0_0_8px_hsl(174,62%,50%,0.5)] transition-all duration-300">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-[hsl(217,91%,60%)]/10 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[hsl(213,97%,87%)]/50">© 2026 HostFlow AI. All rights reserved.</p>
        <p className="text-xs text-[hsl(213,97%,87%)]/50">Powered by AI · Built for every industry</p>
      </div>
    </div>
  </footer>
);

export default Footer;
