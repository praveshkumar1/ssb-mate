import { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    if (isDropdownOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDropdownOpen]);

  // click outside to close and focus trap simple
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', onClick);
      // move focus to first menu item
      setTimeout(() => firstMenuItemRef.current?.focus(), 0);
    }
    return () => document.removeEventListener('mousedown', onClick);
  }, [isDropdownOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-primary">SSB Coach</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/coaches" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors" aria-label="Find Coaches">
                Find Coaches
              </Link>
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
            {(() => {
              const auth = useAuth();
              if (auth.isAuthenticated) {
                const user = auth.user;
                const initials = user ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() : 'U';
                const avatarUrl = user?.avatarUrl || user?.avatar || null;
                return (
                  <div className="relative" ref={dropdownRef}>
                    <Button variant="ghost" onClick={() => setIsDropdownOpen(o => !o)} aria-haspopup="true" aria-expanded={isDropdownOpen} aria-controls="profile-menu">
                      {avatarUrl ? (
                        // image avatar
                        <img src={avatarUrl} alt={`${user?.firstName || 'User'} avatar`} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-semibold">{initials}</span>
                      )}
                    </Button>
                    {isDropdownOpen && (
                      <div id="profile-menu" role="menu" className="absolute right-0 mt-2 w-44 bg-card rounded shadow-lg py-1 z-50 ring-1 ring-black/5" aria-label="Profile menu">
                        <Link ref={firstMenuItemRef as any} to="/dashboard/" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" role="menuitem" onClick={() => setIsDropdownOpen(false)}>Account</Link>
                        <Link to="/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-muted" role="menuitem" onClick={() => setIsDropdownOpen(false)}>Settings</Link>
                        <button className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted" role="menuitem" onClick={() => { auth.logout(); setIsDropdownOpen(false); window.location.href = '/#about'; }}>Logout</button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <>
                  <Link to="/login"><Button variant="ghost" aria-label="Sign in">Sign In</Button></Link>
                  <Link to="/register"><Button aria-label="Get started">Get Started</Button></Link>
                </>
              );
            })()}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link to="/coaches" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Find Coaches
              </Link>
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
                {(() => {
                  const auth = useAuth();
                  if (auth.isAuthenticated) {
                    return (
                      <>
              <Link to="/profile/edit"><Button className="justify-start">Account</Button></Link>
              <Link to="/settings"><Button className="justify-start">Settings</Button></Link>
              <Button className="justify-start text-destructive" onClick={() => { auth.logout(); window.location.href = '/#about'; }}>Logout</Button>
                      </>
                    );
                  }
                  return (
                    <>
                      <Link to="/login"><Button variant="ghost" className="justify-start">Sign In</Button></Link>
                      <Link to="/register"><Button className="justify-start">Get Started</Button></Link>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;