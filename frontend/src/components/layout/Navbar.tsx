import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-primary">SSB Coach</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#coaches" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Find Coaches
              </a>
              <a href="#how-it-works" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                How it Works
              </a>
              <a href="#blog" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                SSB Tips
              </a>
              <a href="#about" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </a>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost">Sign In</Button>
            <Button>Get Started</Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <a href="#coaches" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Find Coaches
              </a>
              <a href="#how-it-works" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                How it Works
              </a>
              <a href="#blog" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                SSB Tips
              </a>
              <a href="#about" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                About
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="justify-start">Sign In</Button>
                <Button className="justify-start">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;