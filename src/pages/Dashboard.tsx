
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
  Category,
  formatCurrency
} from "@/lib/expenses";
import {
  getGroupExpenses,
  getUserGroups,
  SharedExpense
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
import { CalendarRange, ChartBar, ChartPie } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentGroupExpenses, setRecentGroupExpenses] = useState<SharedExpense[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<{ name: string, amount: number }[]>([]);
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalGroupExpenses, setTotalGroupExpenses] = useState(0);
  
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
    const personalTotal = getCurrentMonthTotal(user.id);
    
    // Get group expenses and calculate user's share
    const userGroups = getUserGroups(user.id);
    let groupExpensesTotal = 0;
    let allGroupExpenses: SharedExpense[] = [];
    let filteredGroupExpenses: SharedExpense[] = [];
    
    userGroups.forEach(group => {
      const groupExpenses = getGroupExpenses(group.id);
      allGroupExpenses = [...allGroupExpenses, ...groupExpenses];
      
      // Filter group expenses based on timeframe
      const filteredExpenses = groupExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= now;
      });
      
      filteredGroupExpenses = [...filteredGroupExpenses, ...filteredExpenses];
      
      // Calculate user's share in each expense
      filteredExpenses.forEach(expense => {
        const userSplit = expense.splits.find(split => split.userId === user.id);
        if (userSplit) {
          groupExpensesTotal += userSplit.amount;
        }
      });
    });
    
    setTotalGroupExpenses(groupExpensesTotal);
    
    // Calculate combined total (personal + group)
    const combinedTotal = personalTotal + groupExpensesTotal;
    setMonthlyTotal(combinedTotal);
    setTotalExpenses(combinedTotal);
    
    // Sort group expenses by date (newest first) and take the first 5
    const sortedGroupExpenses = filteredGroupExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    setRecentGroupExpenses(sortedGroupExpenses);
    
    // Get recent personal expenses
    const expenses = getCurrentMonthExpenses(user.id);
    setRecentExpenses(expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    );
    
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
    
    // Get personal expense history
    const expensesByPeriod = getExpensesByPeriod(user.id, historyPeriod)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Convert group expenses to the same format as personal expenses for chart
    const groupExpensesByPeriod: Record<string, number> = {};
    
    filteredGroupExpenses.forEach(expense => {
      const date = new Date(expense.date);
      let periodKey: string;
      
      if (historyPeriod === "day") {
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (historyPeriod === "month") {
        periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        periodKey = `${date.getFullYear()}`;
      }
      
      const userShare = expense.splits.find(split => split.userId === user.id)?.amount || 0;
      
      if (!groupExpensesByPeriod[periodKey]) {
        groupExpensesByPeriod[periodKey] = 0;
      }
      
      groupExpensesByPeriod[periodKey] += userShare;
    });
    
    // Combine personal and group expenses for chart
    const combinedHistory: Record<string, number> = {};
    
    // Add personal expenses
    expensesByPeriod.forEach(item => {
      combinedHistory[item.date] = item.total;
    });
    
    // Add group expenses
    Object.entries(groupExpensesByPeriod).forEach(([date, amount]) => {
      if (!combinedHistory[date]) {
        combinedHistory[date] = 0;
      }
      combinedHistory[date] += amount;
    });
    
    // Format the combined history for chart
    let formattedHistory: { name: string, amount: number }[] = [];
    
    if (timeFilter === "week") {
      // For week, show last 7 days
      const last7Days = Object.entries(combinedHistory)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, total]) => ({
          name: format(new Date(date), "EEE"),
          amount: total,
          fullDate: date
        }));
      
      formattedHistory = last7Days;
    } else if (timeFilter === "year") {
      // For year, show months
      const monthlyData = Object.entries(combinedHistory)
        .map(([date, total]) => ({
          name: format(new Date(`${date}-01`), "MMM"),
          amount: total,
          fullDate: date
        }));
      
      formattedHistory = monthlyData;
    } else {
      // For month, show days of the month
      const dailyData = Object.entries(combinedHistory)
        .map(([date, total]) => ({
          name: format(new Date(date), "dd"),
          amount: total,
          fullDate: date
        }))
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
      
      formattedHistory = dailyData;
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
            <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {timeFilter === "week" 
                ? `Week of ${format(new Date(), "MMMM d")}`
                : timeFilter === "year" 
                  ? format(new Date(), "yyyy") 
                  : format(new Date(), "MMMM yyyy")}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-400">Personal</span>
                <span className="text-white font-semibold">{formatCurrency(monthlyTotal - totalGroupExpenses)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Group</span>
                <span className="text-white font-semibold">{formatCurrency(totalGroupExpenses)}</span>
              </div>
            </div>
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
            <div className="text-2xl font-bold text-white">
              {recentExpenses.length + recentGroupExpenses.length}
            </div>
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
              <ResponsiveContainer width="100%" height="100%" className="transform transition-transform hover:scale-105">
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
                    className="drop-shadow-xl"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
              <ResponsiveContainer width="100%" height="100%" className="transform transition-transform hover:scale-105">
                <BarChart data={expenseHistory}>
                  <XAxis dataKey="name" stroke="#E0E0E0" />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)} 
                    contentStyle={{ 
                      backgroundColor: '#2D2D2D', 
                      borderColor: '#3A3A3A',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#9b87f5" 
                    radius={[4, 4, 0, 0]}
                    style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))' }}
                  />
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
          <CardTitle className="text-white text-xl">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 || recentGroupExpenses.length > 0 ? (
            <div className="space-y-4">
              {/* Personal Expenses */}
              {recentExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between border-b border-[#3A3A3A] pb-3"
                >
                  <div>
                    <p className="font-medium text-white text-lg">{expense.description}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="font-semibold text-lg text-white">{formatCurrency(expense.amount)}</div>
                </div>
              ))}
              
              {/* Group Expenses */}
              {recentGroupExpenses.map((expense) => {
                const userShare = expense.splits.find(split => split.userId === user?.id)?.amount || 0;
                return (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between border-b border-[#3A3A3A] pb-3"
                  >
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-white text-lg">{expense.description}</p>
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                          Group
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="font-semibold text-lg text-white">{formatCurrency(userShare)}</div>
                  </div>
                );
              })}
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
