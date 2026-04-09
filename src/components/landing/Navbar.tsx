import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]/80 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="container flex items-center justify-between h-[68px] px-6 lg:px-10">
        {/* Logo — compact, single line */}
        <div className="cursor-pointer shrink-0 mr-8" onClick={() => navigate("/")}>
          <Logo size="sm" showName />
        </div>

        {/* Nav links — centered with generous spacing */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {[
            { href: "#features", label: t("nav.features") },
            { href: "#industries", label: t("nav.industries") },
            { href: "#pricing", label: t("nav.pricing") },
            { href: "/about", label: t("nav.about") },
            { href: "/marketplace", label: "Marketplace" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium tracking-[0.02em] text-[hsl(213,20%,60%)] hover:text-foreground relative py-1 transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-primary/50 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions — right side */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="w-px h-5 bg-white/10 mx-1 hidden md:block" />
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
      </div>
    </nav>
  );
};

export default Navbar;
