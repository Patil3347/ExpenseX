
import { PieChart, Users, Bell, CreditCard, ShieldCheck, Cloud } from "lucide-react";

export const HomeFeatures = () => {
  const features = [
    {
      icon: PieChart,
      title: "Spending Overview",
      description: "View a breakdown of my expenses and insights.",
      colorClass: "bg-primary/10",
      iconClass: "text-primary",
    },
    {
      icon: Users,
      title: "Track & Save",
      description: "Analyze your spending habits and find easy savings tips.",
      colorClass: "bg-secondary/10",
      iconClass: "text-secondary",
    },
    {
      icon: Bell,
      title: "Expense Breakdown",
      description: "Show detailed summary of your spending.",
      colorClass: "bg-primary/10",
      iconClass: "text-primary",
    },
    {
      icon: CreditCard,
      title: "Smart Spend",
      description: "See where your money goes and start saving today.",
      colorClass: "bg-secondary/10",
      iconClass: "text-secondary",
    },
    {
      icon: ShieldCheck,
      title: "Your Money, Your Control",
      description: "Take charge of your finances with personalized insights and easy-to-use tracking tools.",
      colorClass: "bg-primary/10",
      iconClass: "text-primary",
    },
    {
      icon: Cloud,
      title: "Budget Like a Pro",
      description: "Master your money with real-time insights and customized budgeting advice.",
      colorClass: "bg-secondary/10",
      iconClass: "text-secondary",
    },
  ];

  return (
    <section className="py-20 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features for Smart Finance
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to manage your expenses and achieve your financial goals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-[#2D2D2D] p-6 rounded-lg feature-card transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 ${feature.colorClass} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.iconClass}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
