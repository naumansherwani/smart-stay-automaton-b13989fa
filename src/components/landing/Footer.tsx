import Logo from "@/components/Logo";

const Footer = () => (
  <footer className="py-12 bg-foreground">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold text-background">HostFlow AI</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 HostFlow AI. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
