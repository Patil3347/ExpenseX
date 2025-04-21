
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const HomeArticles = () => {
  const [showMore, setShowMore] = useState(false);

  const initialArticles = [
    {
      image: "https://images.pexels.com/photos/5926229/pexels-photo-5926229.jpeg",
      title: "Save More Money: Tips to Cut Unnecessary Expenses",
      description: "Learn actionable tips to cut unnecessary expenses, reduce your spending, and save more money each month with the help of Expenses Manager.",
    },
    {
      image: "https://images.pexels.com/photos/4386373/pexels-photo-4386373.jpeg",
      title: "How to Create a Realistic Budget: A Step-by-Step Guide",
      description: "Learn how to create a realistic budget that helps you manage your finances effectively and reduce financial stress with step-by-step guide using Expenses Manager.",
    },
    {
      image: "https://images.pexels.com/photos/5909813/pexels-photo-5909813.jpeg",
      title: "How to integrate Expenses Manager in your life?",
      description: "There are only two types of people in this world, those who download the Expenses Manager and those who don't care about their money.",
    },
  ];

  return (
    <section className="py-20 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Insights and Tips for Smarter Finance Management
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {initialArticles.map((article, index) => (
            <div key={index} className="bg-[#2D2D2D] rounded-lg overflow-hidden shadow-lg">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {article.title}
                </h3>
                <p className="text-gray-400">
                  {article.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button
            onClick={() => setShowMore(!showMore)}
            className="bg-primary/90 backdrop-blur-sm text-white px-8 py-3 !rounded-button hover:bg-primary transition-all duration-300 font-medium whitespace-nowrap shadow-lg shadow-primary/20"
          >
            {showMore ? "Show Less" : "See More Articles"}
          </Button>
        </div>
      </div>
    </section>
  );
};
