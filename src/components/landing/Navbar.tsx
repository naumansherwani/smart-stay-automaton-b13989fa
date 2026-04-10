import { useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#industries", label: t("nav.industries") },
    { href: "#pricing", label: t("nav.pricing") },
    { href: "/about", label: t("nav.about") },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/reviews", label: "Reviews" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]/80 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="container flex items-center justify-between h-[68px] px-6 lg:px-10">
        {/* Logo */}
        <div className="cursor-pointer shrink-0 mr-8" onClick={() => navigate("/")}>
          <Logo size="sm" showName />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium tracking-[0.02em] text-[hsl(213,20%,60%)] hover:text-foreground relative py-1 transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary/50 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="w-px h-5 bg-white/10 mx-1" />
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[13px] transition-colors duration-300" onClick={() => navigate("/dashboard")}>{t("nav.dashboard")}</Button>
              <Button variant="outline" size="sm" className="border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] text-[13px] transition-all duration-300" onClick={() => { signOut(); navigate("/"); }}>{t("nav.logout")}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium text-[13px] transition-colors duration-300" onClick={() => navigate("/login")}>{t("nav.login")}</Button>
              <Button size="sm" className="bg-gradient-primary text-primary-foreground border border-primary/20 shadow-[0_0_24px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_36px_hsl(var(--primary)/0.35)] hover:border-primary/40 transition-all duration-500 px-5 text-[13px] font-semibold" onClick={() => navigate("/signup")}>{t("nav.startTrial")}</Button>
            </>
          )}
        </div>

        {/* Mobile: minimal actions + hamburger */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[hsl(222,47%,11%)]/95 backdrop-blur-2xl border-t border-white/[0.06] animate-in slide-in-from-top-2 duration-200">
          <div className="container px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-[hsl(213,20%,60%)] hover:text-foreground py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-white/[0.06] pt-3 space-y-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>{t("nav.dashboard")}</Button>
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-muted-foreground" onClick={() => { signOut(); navigate("/"); setMobileOpen(false); }}>{t("nav.logout")}</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => { navigate("/login"); setMobileOpen(false); }}>{t("nav.login")}</Button>
                  <Button size="sm" className="w-full bg-gradient-primary text-primary-foreground font-semibold" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>{t("nav.startTrial")}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
