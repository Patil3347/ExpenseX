
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategories,
  getExpenses,
  getCategoryTotals,
  getExpensesByPeriod,
  Expense,
  Category,
} from "@/lib/expenses";
import { formatIndianCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [timeData, setTimeData] = useState<{ date: string; amount: number }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) {
      const allExpenses = getExpenses(user.id);
      const allCategories = getCategories(user.id);
      setExpenses(allExpenses);
      setCategories(allCategories);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !expenses.length) return;

    // Filter expenses based on timeframe
    const now = new Date();
    let filteredExpenses: Expense[] = [];
    
    if (timeframe === "week") {
      // Last 7 days
      const lastWeekDate = new Date(now);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= lastWeekDate && expenseDate <= now;
      });
    } else if (timeframe === "month") {
      // Current month
      const startMonth = startOfMonth(now);
      const endMonth = endOfMonth(now);
      
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startMonth && expenseDate <= endMonth;
      });
    } else if (timeframe === "year") {
      // Current year
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === now.getFullYear();
      });
    }

    // Calculate total
    const calculatedTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    setTotal(calculatedTotal);

    // Prepare category data
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      if (!categoryTotals[expense.categoryId]) {
        categoryTotals[expense.categoryId] = 0;
      }
      categoryTotals[expense.categoryId] += expense.amount;
    });

    const categoryChartData = Object.entries(categoryTotals)
      .map(([categoryId, value]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category ? category.name : "Unknown",
          value,
          color: category ? category.color : "#cccccc",
        };
      })
      .sort((a, b) => b.value - a.value);

    setCategoryData(categoryChartData);

    // Prepare time-based data
    if (timeframe === "week") {
      // Daily data for the week
      const lastWeek = eachDayOfInterval({
        start: subMonths(now, 1),
        end: now,
      }).slice(-7);

      const dailyData = lastWeek.map((date) => {
        const dayExpenses = filteredExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getDate() === date.getDate() &&
            expenseDate.getMonth() === date.getMonth() &&
            expenseDate.getFullYear() === date.getFullYear()
          );
        });

        const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
          date: format(date, "EEE"),
          amount: dayTotal,
        };
      });

      setTimeData(dailyData);
    } else if (timeframe === "month") {
      // Weekly data for the month
      const monthData = [];
      // Get weekly data for simplicity
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(1 + i * 7);
        
        const weekEnd = new Date(now);
        weekEnd.setDate(7 + i * 7);
        
        const weekExpenses = filteredExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });
        
        const weekTotal = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        monthData.push({
          date: `Week ${i + 1}`,
          amount: weekTotal,
        });
      }
      
      setTimeData(monthData);
    } else if (timeframe === "year") {
      // Monthly data for the year
      const monthlyData = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        
        const monthExpenses = filteredExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        
        const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        monthlyData.push({
          date: format(monthStart, "MMM"),
          amount: monthTotal,
        });
      }
      
      setTimeData(monthlyData);
    }
  }, [expenses, categories, timeframe, user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <Select value={timeframe} onValueChange={(value: "week" | "month" | "year") => setTimeframe(value)}>
          <SelectTrigger className="w-[180px] bg-[#2D2D2D] border-[#3A3A3A] text-white">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white">
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatIndianCurrency(total)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {timeframe === "week"
                ? "Last 7 days"
                : timeframe === "month"
                ? format(new Date(), "MMMM yyyy")
                : format(new Date(), "yyyy")}
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
              With activity in this period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Avg. Daily Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatIndianCurrency(
                timeframe === "week"
                  ? total / 7
                  : timeframe === "month"
                  ? total / 30
                  : total / 365
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Per day during this period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
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

        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">
              Spending Over Time ({timeframe === "week" ? "Daily" : timeframe === "month" ? "Weekly" : "Monthly"})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {timeData.length > 0 && timeData.some(item => item.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                  <XAxis dataKey="date" stroke="#E0E0E0" />
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
          <CardTitle className="text-white">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-white">{category.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatIndianCurrency(category.value)}</span>
                  </div>
                  <div className="h-2 bg-[#3A3A3A] rounded-full">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(category.value / total) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {((category.value / total) * 100).toFixed(1)}% of total
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">
              No spending data available for this period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
