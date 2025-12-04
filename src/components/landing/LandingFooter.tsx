import { Shield } from "lucide-react";
import Link from "next/link";

const LandingFooter = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">Cylend</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm">
            <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
              Enter App
            </Link>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>

          {/* Tagline */}
          <div className="text-sm text-muted-foreground">
            Your Credit. Your Privacy.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
