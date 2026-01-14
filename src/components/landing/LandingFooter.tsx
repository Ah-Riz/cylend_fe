import Link from "next/link";
import Logo from "@/components/Logo";

const LandingFooter = () => {
  return (
    <footer className="py-20 px-6 relative z-10">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-12 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2 scale-125">
            <Logo className="h-10 w-auto" variant="primary" />
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 md:gap-16 text-lg font-medium text-muted-foreground/80">
            <Link href="/app" className="hover:text-primary transition-colors">
              Enter App
            </Link>
            <a
              href="https://docs.cylend.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com/Ah-Riz/cylend_fe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
