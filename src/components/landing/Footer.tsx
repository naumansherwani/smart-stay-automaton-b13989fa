import { Calendar } from "lucide-react";

const Footer = () => (
  <footer className="py-12 bg-foreground">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-background">HostSync</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 HostSync. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
