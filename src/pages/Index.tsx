
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { HomeNav } from "@/components/home/HomeNav";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeArticles } from "@/components/home/HomeArticles";
import { HomeCTA } from "@/components/home/HomeCTA";
import { HomeFooter } from "@/components/home/HomeFooter";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <HomeNav onGetStarted={handleGetStarted} />
      <HomeHero onGetStarted={handleGetStarted} />
      <div id="features">
        <HomeFeatures />
      </div>
      <HomeStats />
      <HomeArticles />
      <HomeCTA />
      <HomeFooter />
    </div>
  );
};

export default Index;
