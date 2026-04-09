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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]/90 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="container flex items-center justify-between h-[72px] px-6 lg:px-10">
        <div className="cursor-pointer" onClick={() => navigate("/")}>
          <Logo size="lg" showName />
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[13px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300">{t("nav.features")}</a>
          <a href="#industries" className="text-[13px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300">{t("nav.industries")}</a>
          <a href="#pricing" className="text-[13px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300">{t("nav.pricing")}</a>
          <a href="/about" className="text-[13px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300">{t("nav.about")}</a>
          <a href="/marketplace" className="text-[13px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300">Marketplace</a>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors duration-300 ml-1" onClick={() => navigate("/dashboard")}>{t("nav.dashboard")}</Button>
              <Button variant="outline" size="sm" className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300" onClick={() => { signOut(); navigate("/"); }}>{t("nav.logout")}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-300 ml-1" onClick={() => navigate("/login")}>{t("nav.login")}</Button>
              <Button size="sm" className="bg-gradient-primary border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:border-primary/50 transition-all duration-500 px-5" onClick={() => navigate("/signup")}>{t("nav.startTrial")}</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
