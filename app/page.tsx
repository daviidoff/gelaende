import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Gelände</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <AuthButton />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl px-6 py-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Campus Leben. Echt verbunden.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Mehr als Social Media – Dein Campus-Netzwerk für echte Begegnungen
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl">
            <div className="bg-card/50 rounded-xl p-6 border border-border/30 backdrop-blur-sm">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-lg mb-2">Wer ist da?</h3>
              <p className="text-sm text-muted-foreground">
                Sieh was deine Freunde gerade machen
              </p>
            </div>
            <div className="bg-card/50 rounded-xl p-6 border border-border/30 backdrop-blur-sm">
              <div className="text-3xl mb-3">🍽️</div>
              <h3 className="font-semibold text-lg mb-2">Spontan treffen</h3>
              <p className="text-sm text-muted-foreground">
                Verabrede dich spontan zum Essen oder Lernen
              </p>
            </div>
            <div className="bg-card/50 rounded-xl p-6 border border-border/30 backdrop-blur-sm">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold text-lg mb-2">Echt verbunden</h3>
              <p className="text-sm text-muted-foreground">
                Teile was du machst und bleib mit Freunden connected
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/map">
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                🗺️ Zur Karte
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Jetzt starten
              </Button>
            </Link>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8 text-muted-foreground">
          <p>Gelände – Campus Social Network</p>
        </footer>
      </div>
    </main>
  );
}
