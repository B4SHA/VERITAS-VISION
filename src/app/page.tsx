import { Button } from "@/components/ui/button";
import { ArrowDown, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/use-language";

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="relative flex items-center justify-center h-[calc(100vh-4rem)] text-center text-white bg-grid-white/[0.05]">
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          <div className="z-10 px-4 sm:px-6 lg:px-8 space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-blue-400">
              Uncover the Truth
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
              In an ocean of digital noise, Veritas Vision is your anchor for truth. Our essential AI-powered toolkit empowers you to critically analyze news, video, and audio content, navigating the online world with clarity and confidence.
            </p>
          </div>
          <div className="absolute bottom-8 animate-bounce">
            <ArrowDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">A Toolkit for the Digital Age</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Equip yourself with the tools to discern fact from fiction. Veritas Vision offers a suite of analyzers to help you stay informed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                title="News Sleuth"
                description="Analyze news articles for credibility, bias, and misinformation."
                href="/news"
              />
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                title="Video Integrity"
                description="Detect deepfakes and manipulations in video files."
                href="/video"
              />
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                title="Audio Authenticator"
                description="Verify the authenticity of audio recordings and identify AI-generated speech."
                href="/audio"
              />
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                title="Image Verifier"
                description="Examine images for signs of tampering or AI generation."
                href="/image"
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">Ready to See Clearly?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Start analyzing content today and arm yourself against the wave of digital deception.
            </p>
            <Button size="lg" asChild>
              <Link href="/news">Get Started</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) {
  return (
    <Link href={href} className="block">
      <div className="bg-card p-6 rounded-lg h-full border border-transparent hover:border-primary transition-colors duration-300 transform hover:-translate-y-1">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
