
import { Button } from "@/components/ui/button";

interface HomeHeroProps {
  onGetStarted: () => void;
}

export const HomeHero = ({ onGetStarted }: HomeHeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center bg-[#1A1A1A] overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A] to-transparent" />

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=1920&auto=format&fit=crop&q=80"
        alt="Financial Abstract"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />

      {/* Content Wrapper */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl py-32 mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Manage Money <span className="text-primary">Effortlessly</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
            Your personal finance companion for smarter expense tracking and better savings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onGetStarted}
              className="bg-primary text-white px-8 py-3 !rounded-button hover:bg-opacity-80 transition-all duration-300 font-medium whitespace-nowrap"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
