import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin,
  Shield,
  Award,
  Users
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                SSB Academy
              </h3>
              <p className="text-muted-foreground">
                Connecting SSB aspirants with expert coaches and mentors. 
                Your trusted partner in defence career success.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#coaches" className="text-muted-foreground hover:text-primary transition-smooth">
                    Find Coaches
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-smooth">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-muted-foreground hover:text-primary transition-smooth">
                    SSB Tips & Blog
                  </a>
                </li>
                <li>
                  <a href="#success-stories" className="text-muted-foreground hover:text-primary transition-smooth">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-muted-foreground hover:text-primary transition-smooth">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#help" className="text-muted-foreground hover:text-primary transition-smooth">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-muted-foreground hover:text-primary transition-smooth">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#become-coach" className="text-muted-foreground hover:text-primary transition-smooth">
                    Become a Coach
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="text-muted-foreground hover:text-primary transition-smooth">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Get in Touch</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">support@ssbacademy.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">New Delhi, India</span>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-success" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-success" />
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-success" />
                    <span>Trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom Footer */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm">
              © 2023 SSB Academy. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Made with ❤️ for SSB Aspirants</span>
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <span className="font-semibold text-primary">Lovable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;