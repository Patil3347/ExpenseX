
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getCurrentMonthTotal, 
  getCurrentMonthExpenses, 
  getExpensesByPeriod,
  getCategoryTotals,
  getCategories,
  Expense,
  Category
} from "@/lib/expenses";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { formatIndianCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<{ name: string, amount: number }[]>([]);
  
  useEffect(() => {
    if (user) {
      // Get monthly total
      const total = getCurrentMonthTotal(user.id);
      setMonthlyTotal(total);
      
      // Get recent expenses
      const expenses = getCurrentMonthExpenses(user.id);
      setRecentExpenses(expenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5));
      
      // Get category data for pie chart
      const categoryTotals = getCategoryTotals(user.id);
      const categories = getCategories(user.id);
      const categoryChartData = Object.entries(categoryTotals)
        .filter(([_, value]) => value > 0)
        .map(([categoryId, value]) => {
          const category = categories.find(cat => cat.id === categoryId) as Category;
          return {
            name: category.name,
            value,
            color: category.color,
          };
        });
      setCategoryData(categoryChartData);
      
      // Get expense history for bar chart
      const expensesByMonth = getExpensesByPeriod(user.id, "month")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-6) // Last 6 months
        .map(item => ({
          name: format(new Date(`${item.date}-01`), "MMM"),
          amount: item.total,
        }));
      setExpenseHistory(expensesByMonth);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatIndianCurrency(monthlyTotal)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{categoryData.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              Active Categories
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentExpenses.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              This Month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatIndianCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {expenseHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseHistory}>
                  <XAxis dataKey="name" stroke="#E0E0E0" />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip formatter={(value) => formatIndianCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#9b87f5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between border-b border-[#3A3A3A] pb-2"
                >
                  <div>
                    <p className="font-medium text-white">{expense.description}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="font-semibold text-white">{formatIndianCurrency(expense.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No recent expenses
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
