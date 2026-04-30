import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Brain, Globe, Shield, TrendingUp, ArrowRight, Users, Sparkles, Eye, Mic, CalendarClock, Bot, HeartHandshake, ShieldCheck, LineChart, Languages, Quote } from "lucide-react";
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

  const founderFeatures = [
    { icon: Mic, title: t("about.founderFeat1Title"), desc: t("about.founderFeat1Desc"), color: "hsl(var(--primary))" },
    { icon: ShieldCheck, title: t("about.founderFeat2Title"), desc: t("about.founderFeat2Desc"), color: "hsl(216, 88%, 60%)" },
    { icon: Bot, title: t("about.founderFeat3Title"), desc: t("about.founderFeat3Desc"), color: "hsl(270, 80%, 70%)" },
    { icon: HeartHandshake, title: t("about.founderFeat4Title"), desc: t("about.founderFeat4Desc"), color: "hsl(340, 75%, 60%)" },
    { icon: CalendarClock, title: t("about.founderFeat5Title"), desc: t("about.founderFeat5Desc"), color: "hsl(160, 60%, 45%)" },
    { icon: LineChart, title: t("about.founderFeat6Title"), desc: t("about.founderFeat6Desc"), color: "hsl(38, 92%, 60%)" },
    { icon: Languages, title: t("about.founderFeat7Title"), desc: t("about.founderFeat7Desc"), color: "hsl(190, 80%, 50%)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="container max-w-4xl space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              <span className="text-foreground">About </span>
              <span className="bg-gradient-to-r from-primary via-[hsl(216,88%,55%)] to-[hsl(270,80%,65%)] bg-clip-text text-transparent">
                HostFlow AI Technologies
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("about.subtitle")}</p>
          </div>

          {/* Founder Message */}
          <Card className="relative overflow-hidden border-primary/30 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-[hsl(216,88%,55%)]/5 to-[hsl(270,80%,65%)]/10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[hsl(216,88%,55%)] to-[hsl(270,80%,65%)]" />
            <CardContent className="relative p-8 md:p-12 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[hsl(216,88%,55%)] flex items-center justify-center shadow-lg">
                  <Quote className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary via-[hsl(216,88%,55%)] to-[hsl(270,80%,65%)] bg-clip-text text-transparent">
                  {t("about.founderMsgTitle")}
                </h2>
              </div>

              <div className="space-y-5 text-muted-foreground text-base md:text-lg leading-relaxed">
                <p>{t("about.founderMsgP1")}</p>
                <p>{t("about.founderMsgP2")}</p>
                <p>{t("about.founderMsgP3")}</p>
                <p className="font-medium text-foreground">{t("about.founderMsgFeaturesIntro")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {founderFeatures.map((f) => (
                  <div key={f.title} className="flex gap-3 p-4 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-colors">
                    <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${f.color}20` }}>
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base">{f.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-5 text-muted-foreground text-base md:text-lg leading-relaxed pt-2">
                <p>{t("about.founderMsgP4")}</p>
                <p>{t("about.founderMsgP5")}</p>
                <p className="text-foreground font-semibold text-lg md:text-xl text-center px-4 py-5 rounded-xl bg-gradient-to-r from-primary/10 via-[hsl(216,88%,55%)]/10 to-[hsl(270,80%,65%)]/10 border border-primary/20">
                  {t("about.founderMsgClosing")}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-1 text-center">
                <p className="text-muted-foreground italic">{t("about.founderSignOff")}</p>
                <p className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(216,88%,55%)] bg-clip-text text-transparent">
                  {t("about.founderName")}
                </p>
                <p className="text-sm text-muted-foreground">{t("about.founderTitle")}</p>
              </div>
            </CardContent>
          </Card>

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
            <CardContent className="p-8 space-y-4">
              <Eye className="w-8 h-8 text-[hsl(270,80%,70%)] mx-auto" />
              <h2 className="text-2xl font-bold text-foreground text-center">{t("about.visionTitle")}</h2>
              <p className="text-muted-foreground text-lg text-center">{t("about.vision")}</p>
              <p className="text-muted-foreground text-base">{t("about.visionDesc")}</p>
              
              <p className="text-muted-foreground text-base font-semibold">{t("about.visionBelieve")}</p>
              <ul className="space-y-2 text-muted-foreground text-base max-w-md mx-auto">
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionBullet1")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionBullet2")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionBullet3")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionBullet4")}</li>
              </ul>

              <p className="text-muted-foreground text-base italic text-center">{t("about.visionSeparation")}</p>

              <p className="text-muted-foreground text-base font-semibold">{t("about.visionGoal")}</p>
              <ul className="space-y-2 text-muted-foreground text-base max-w-md mx-auto">
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionGoalBullet1")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionGoalBullet2")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionGoalBullet3")}</li>
                <li className="flex items-center gap-2"><span className="text-[hsl(270,80%,70%)]">✦</span> {t("about.visionGoalBullet4")}</li>
              </ul>

              <p className="text-muted-foreground text-base font-semibold text-center">{t("about.visionFooter")}</p>
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
