
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] relative overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-white text-2xl font-bold">ExpenseX</div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a>
          <a href="/features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="/articles" className="text-gray-300 hover:text-white transition-colors">Articles</a>
          <a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a>
        </div>
        
        <Button 
          onClick={handleGetStarted}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-6"
        >
          Get Started
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32 pb-24 text-center relative z-10">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
          Manage Money{" "}
          <span className="block text-teal-500">Effortlessly</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Your personal finance companion for smarter expense tracking and better savings.
        </p>
        <Button 
          onClick={handleGetStarted}
          className="bg-teal-500 hover:bg-teal-600 text-white text-lg rounded-full px-8 py-6"
        >
          Get Started
        </Button>
      </div>

      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-0">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-purple-800/30 via-teal-500/20 to-blue-800/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-800/30 via-purple-800/20 to-teal-500/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
