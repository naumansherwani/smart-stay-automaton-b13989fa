import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Brain, Globe, Shield, TrendingUp, ArrowRight, Users, Sparkles, Eye } from "lucide-react";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const reasons = [
    { icon: Brain, title: t("about.why1Title"), desc: t("about.why1Desc"), color: "hsl(var(--primary))" },
    { icon: Globe, title: t("about.why2Title"), desc: t("about.why2Desc"), color: "hsl(270, 80%, 70%)" },
    { icon: Shield, title: t("about.why3Title"), desc: t("about.why3Desc"), color: "hsl(160, 60%, 45%)" },
    { icon: TrendingUp, title: t("about.why4Title"), desc: t("about.why4Desc"), color: "hsl(38, 92%, 60%)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="container max-w-4xl space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">{t("about.title")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("about.subtitle")}</p>
          </div>

          {/* Mission */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8 space-y-4">
              <Sparkles className="w-8 h-8 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground text-center">{t("about.missionTitle")}</h2>
              <p className="text-muted-foreground text-lg text-center">{t("about.mission")}</p>
              <ul className="space-y-2 text-muted-foreground text-base max-w-md mx-auto">
                <li className="flex items-center gap-2"><span className="text-primary">✦</span> {t("about.missionBullet1")}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✦</span> {t("about.missionBullet2")}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✦</span> {t("about.missionBullet3")}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✦</span> {t("about.missionBullet4")}</li>
              </ul>
              <p className="text-muted-foreground text-base text-center italic">{t("about.missionFooter")}</p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="border-[hsl(270,80%,70%)]/20 bg-[hsl(270,80%,70%)]/5">
            <CardContent className="p-8 text-center space-y-3">
              <Eye className="w-8 h-8 text-[hsl(270,80%,70%)] mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">{t("about.visionTitle")}</h2>
              <p className="text-muted-foreground text-lg">{t("about.vision")}</p>
            </CardContent>
          </Card>

          {/* Story */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{t("about.storyTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.story")}</p>
          </div>

          {/* Why Us */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">{t("about.whyTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reasons.map((r) => (
                <Card key={r.title} className="group hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.color}15` }}>
                      <r.icon className="w-6 h-6" style={{ color: r.color }} />
                    </div>
                    <h3 className="font-semibold text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team */}
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Users className="w-8 h-8 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">{t("about.teamTitle")}</h2>
              <p className="text-muted-foreground">{t("about.teamDesc")}</p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" className="bg-gradient-primary" onClick={() => navigate("/signup")}>
              {t("hero.cta")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
