
import { Link } from "react-router-dom";

export const HomeFooter = () => {
  return (
    <footer className="bg-[#1A1A1A] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="text-2xl font-['Pacifico'] text-white mb-4 inline-block">
            ExpenseX
          </Link>
          <p className="text-gray-400 mb-6 max-w-md">
            The smart way to track expenses, split bills, and save money.
          </p>
          <p className="text-gray-400">
            Contact us: For queries and support, contact us at help@expensex.com
          </p>
        </div>
        <div className="border-t border-[#2D2D2D] mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 mb-4 md:mb-0">
              © 2025 ExpenseX. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="#" className="text-gray-500 hover:text-primary transition-colors duration-300">Terms</Link>
              <Link to="#" className="text-gray-500 hover:text-primary transition-colors duration-300">Privacy</Link>
              <Link to="#" className="text-gray-500 hover:text-primary transition-colors duration-300">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
