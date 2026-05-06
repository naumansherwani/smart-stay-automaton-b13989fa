import { Construction, Mail } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Construction className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold">
          <span className="bg-gradient-to-r from-[hsl(174,62%,55%)] via-[hsl(200,80%,65%)] to-[hsl(217,91%,60%)] bg-clip-text text-transparent">
            HostFlow AI
          </span>
        </h1>

        <h2 className="text-2xl font-bold text-foreground">We'll Be Right Back</h2>

        <p className="text-muted-foreground text-base leading-relaxed">
          We're upgrading our systems to serve you better. This won't take long — we're working hard behind the scenes to bring you an even more powerful experience.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span>support@hostflowai.net</span>
        </div>

        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Upgrading in progress
          </div>
        </div>
      </div>
    </div>
  );
}
