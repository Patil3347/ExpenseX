
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  getGroupExpenses
} from "@/lib/groups";
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
import { format, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { formatIndianCurrency } from "@/lib/utils";
import { CalendarRange, ChartBar, ChartPie } from "lucide-react";
import { getUserGroups } from "@/lib/groups";

export default function Dashboard() {
  const { user } = useAuth();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<{ name: string, amount: number }[]>([]);
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const loadData = () => {
    if (!user) return;
    
    // Calculate start date based on time filter
    const now = new Date();
    let startDate: Date;
    let periodType: "day" | "month" | "year";
    
    switch (timeFilter) {
      case "week":
        startDate = startOfWeek(now);
        periodType = "day";
        break;
      case "year":
        startDate = startOfYear(now);
        periodType = "month";
        break;
      case "month":
      default:
        startDate = startOfMonth(now);
        periodType = "day";
    }
    
    // Get personal expenses
    let personalExpenses = getExpensesByPeriod(user.id, periodType);
    
    // Get group expenses
    const userGroups = getUserGroups(user.id);
    let groupExpensesTotal = 0;
    
    userGroups.forEach(group => {
      const groupExpenses = getGroupExpenses(group.id);
      
      // Only count expenses within the time filter
      const filteredExpenses = groupExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= now;
      });
      
      // For each group expense, add the user's share to the total
      filteredExpenses.forEach(expense => {
        const userSplit = expense.splits.find(split => split.userId === user.id);
        if (userSplit) {
          groupExpensesTotal += userSplit.amount;
        }
      });
    });
    
    // Calculate total expenses (personal + group shares)
    const total = getCurrentMonthTotal(user.id) + groupExpensesTotal;
    setMonthlyTotal(total);
    setTotalExpenses(total);
    
    // Get recent expenses
    const expenses = getCurrentMonthExpenses(user.id);
    setRecentExpenses(expenses.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5));
    
    // Get category data for pie chart
    const categoryTotals = getCategoryTotals(user.id, timeFilter);
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
    let historyPeriod: string;
    switch (timeFilter) {
      case "week":
        historyPeriod = "day";
        break;
      case "year":
        historyPeriod = "month";
        break;
      case "month":
      default:
        historyPeriod = "day";
    }
    
    const expensesByPeriod = getExpensesByPeriod(user.id, historyPeriod)
      .sort((a, b) => a.date.localeCompare(b.date));
      
    let formattedHistory;
    if (timeFilter === "week") {
      // For week, show last 7 days
      formattedHistory = expensesByPeriod
        .slice(-7)
        .map(item => ({
          name: format(new Date(item.date), "EEE"),
          amount: item.total,
        }));
    } else if (timeFilter === "year") {
      // For year, show last 12 months
      formattedHistory = expensesByPeriod
        .slice(-12)
        .map(item => ({
          name: format(new Date(`${item.date}-01`), "MMM"),
          amount: item.total,
        }));
    } else {
      // For month, show days of the month
      formattedHistory = expensesByPeriod
        .slice(-31)
        .map(item => ({
          name: format(new Date(item.date), "dd"),
          amount: item.total,
        }));
    }
    
    setExpenseHistory(formattedHistory);
  };
  
  useEffect(() => {
    loadData();
  }, [user, timeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant={timeFilter === "week" ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeFilter("week")}
            className={timeFilter === "week" ? "bg-primary" : "bg-[#2D2D2D] border-[#3A3A3A]"}
          >
            <CalendarRange className="mr-1 h-4 w-4" /> This Week
          </Button>
          <Button 
            variant={timeFilter === "month" ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeFilter("month")}
            className={timeFilter === "month" ? "bg-primary" : "bg-[#2D2D2D] border-[#3A3A3A]"}
          >
            <CalendarRange className="mr-1 h-4 w-4" /> This Month
          </Button>
          <Button 
            variant={timeFilter === "year" ? "default" : "outline"} 
            size="sm"
            onClick={() => setTimeFilter("year")}
            className={timeFilter === "year" ? "bg-primary" : "bg-[#2D2D2D] border-[#3A3A3A]"}
          >
            <CalendarRange className="mr-1 h-4 w-4" /> This Year
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              {timeFilter === "week" ? "This Week" : timeFilter === "year" ? "This Year" : "This Month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatIndianCurrency(monthlyTotal)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {timeFilter === "week" 
                ? `Week of ${format(new Date(), "MMMM d")}`
                : timeFilter === "year" 
                  ? format(new Date(), "yyyy") 
                  : format(new Date(), "MMMM yyyy")}
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
              {timeFilter === "week" ? "This Week" : timeFilter === "year" ? "This Year" : "This Month"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ChartPie className="h-5 w-5 mr-2" /> Spending by Category
            </CardTitle>
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
            <CardTitle className="text-white flex items-center">
              <ChartBar className="h-5 w-5 mr-2" /> 
              {timeFilter === "week" ? "Daily" : timeFilter === "year" ? "Monthly" : "Daily"} Expenses
            </CardTitle>
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
