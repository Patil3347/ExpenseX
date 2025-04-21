
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface HomeNavProps {
  onGetStarted: () => void;
}

export const HomeNav = ({ onGetStarted }: HomeNavProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-['Pacifico'] text-white">
              ExpenseX
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/10">
                Home
              </Link>
              <Link to="/features" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/10">
                Features
              </Link>
              <Link to="/articles" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/10">
                Articles
              </Link>
              <Link to="/about" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/10">
                About Us
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            <Button 
              onClick={onGetStarted}
              className="bg-primary/90 backdrop-blur-sm px-6 py-2 rounded-full hover:bg-primary transition-all duration-300 whitespace-nowrap shadow-lg shadow-primary/20"
            >
              Get Started
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1A1A1A]/95 backdrop-blur-sm pb-3 px-4">
          <div className="flex flex-col space-y-2">
            <Link to="/" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-base font-medium hover:bg-white/10 transition-all duration-300">
              Home
            </Link>
            <Link to="/features" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-base font-medium hover:bg-white/10 transition-all duration-300">
              Features
            </Link>
            <Link to="/articles" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-base font-medium hover:bg-white/10 transition-all duration-300">
              Articles
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-base font-medium hover:bg-white/10 transition-all duration-300">
              About Us
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700/50 mt-4">
              <Button 
                onClick={onGetStarted}
                className="bg-primary/90 backdrop-blur-sm px-6 py-2 rounded-full hover:bg-primary transition-all duration-300 whitespace-nowrap shadow-lg shadow-primary/20"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
