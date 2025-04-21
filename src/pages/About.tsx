
import { Skeleton } from "@/components/ui/skeleton";

const About = () => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About ExpenseX</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            We're on a mission to revolutionize how people manage their personal finances through
            simple, elegant, and intelligent tools.
          </p>
        </div>
        
        {/* Our Story */}
        <div className="bg-[#2D2D2D] rounded-lg p-8 mb-12 shadow-lg border border-[#3A3A3A]">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-gray-300 mb-4">
            ExpenseX began with a simple observation: managing personal finances should be effortless,
            not overwhelming. Founded in 2023, we set out to create a tool that makes expense tracking
            intuitive and insightful.
          </p>
          <p className="text-gray-300">
            We believe that financial clarity leads to financial freedom. Our platform empowers users to understand
            their spending patterns, make informed decisions, and build healthier financial habits.
          </p>
        </div>
        
        {/* Our Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-[#2D2D2D] rounded-lg p-6 shadow-lg border border-[#3A3A3A]">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <div className="text-primary text-xl font-bold">1</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
            <p className="text-gray-400">
              We believe powerful tools don't need to be complicated. Our clean interface and intuitive design
              make financial management accessible to everyone.
            </p>
          </div>
          
          <div className="bg-[#2D2D2D] rounded-lg p-6 shadow-lg border border-[#3A3A3A]">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <div className="text-secondary text-xl font-bold">2</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Transparency</h3>
            <p className="text-gray-400">
              We're committed to clear, honest communication. Your data is yours, and we'll always be upfront
              about how we handle it.
            </p>
          </div>
          
          <div className="bg-[#2D2D2D] rounded-lg p-6 shadow-lg border border-[#3A3A3A]">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <div className="text-primary text-xl font-bold">3</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Innovation</h3>
            <p className="text-gray-400">
              We continuously evolve our platform based on user feedback and emerging technologies to provide
              the best possible financial management experience.
            </p>
          </div>
        </div>
        
        {/* Team Section */}
        <div className="bg-[#2D2D2D] rounded-lg p-8 mb-12 shadow-lg border border-[#3A3A3A]">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-[#3A3A3A] rounded-full mb-4 overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold">Aarav Patel</h3>
              <p className="text-gray-400">Founder & CEO</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-[#3A3A3A] rounded-full mb-4 overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold">Priya Sharma</h3>
              <p className="text-gray-400">Head of Design</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-[#3A3A3A] rounded-full mb-4 overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold">Vikram Singh</h3>
              <p className="text-gray-400">Lead Developer</p>
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="bg-[#2D2D2D] rounded-lg p-8 shadow-lg border border-[#3A3A3A]">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-300 mb-6">
            Have questions or feedback? We'd love to hear from you. Reach out to our team.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
              <p className="text-gray-400 mb-2">Email: support@expensex.in</p>
              <p className="text-gray-400 mb-2">Phone: +91 98765 43210</p>
              <p className="text-gray-400">Address: 123 Finance Street, Tech Park, Bangalore - 560001</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-3">Office Hours</h3>
              <p className="text-gray-400 mb-2">Monday - Friday: 9:00 AM - 6:00 PM</p>
              <p className="text-gray-400">Weekend: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
