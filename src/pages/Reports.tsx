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
import { getUserGroups, getGroupExpenses, SharedExpense, Group } from "@/lib/groups";
import { formatIndianCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

// --- 3D Utility: Create a shadow gradient (as close as possible for recharts) ---
const bar3DGradient = {
  fill: "url(#bar-3d-gradient)"
};
const pie3DGradient = {
  fill: "url(#pie-3d-gradient)"
};

export default function Reports() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<SharedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [timeData, setTimeData] = useState<{ date: string; amount: number }[]>([]);
  const [total, setTotal] = useState(0);

  // Fetch base data (personal + group expenses, categories)
  useEffect(() => {
    if (user) {
      setExpenses(getExpenses(user.id));
      setCategories(getCategories(user.id));
      // Gather all group expenses across user's groups
      const userGroups: Group[] = getUserGroups(user.id);
      let allGroupExpenses: SharedExpense[] = [];
      userGroups.forEach((group) => {
        allGroupExpenses = [...allGroupExpenses, ...getGroupExpenses(group.id)];
      });
      setGroupExpenses(allGroupExpenses);
    }
  }, [user]);

  useEffect(() => {
    if (!user || (!expenses.length && !groupExpenses.length)) return;
    const now = new Date();
    let filteredExpenses: Expense[] = [];
    let filteredGroupExpenses: SharedExpense[] = [];

    // --- Filter personal expenses by selected timeframe ---
    if (timeframe === "week") {
      // Last 7 days
      const lastWeekDate = subDays(now, 7);
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= lastWeekDate && expenseDate <= now;
      });
      filteredGroupExpenses = groupExpenses.filter((gexp) => {
        const gexpDate = new Date(gexp.date);
        return gexpDate >= lastWeekDate && gexpDate <= now;
      });
    } else if (timeframe === "month") {
      // Current month
      const startMonth = startOfMonth(now);
      const endMonth = endOfMonth(now);
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startMonth && expenseDate <= endMonth;
      });
      filteredGroupExpenses = groupExpenses.filter((gexp) => {
        const gexpDate = new Date(gexp.date);
        return gexpDate >= startMonth && gexpDate <= endMonth;
      });
    } else if (timeframe === "year") {
      const thisYear = now.getFullYear();
      filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === thisYear;
      });
      filteredGroupExpenses = groupExpenses.filter((gexp) => {
        const gexpDate = new Date(gexp.date);
        return gexpDate.getFullYear() === thisYear;
      });
    }

    // --- Validation: Ensure group and personal expenses aren't overlapping ---
    // For group expenses, only count user's share (not total)
    const personalExpenseTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const groupExpenseTotal = filteredGroupExpenses.reduce((sum, gexp) => {
      const userShare = gexp.splits.find((split) => split.userId === user.id)?.amount || 0;
      return sum + userShare;
    }, 0);
    setTotal(personalExpenseTotal + groupExpenseTotal);

    // --- Category (Pie) Data, now includes group expenses as "Group Expenses" category ---
    // Personal categories
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      if (!categoryTotals[expense.categoryId]) categoryTotals[expense.categoryId] = 0;
      categoryTotals[expense.categoryId] += expense.amount;
    });

    // Group expenses grouped as a single pseudo-category (as group expenses may have category in future, but not currently)
    if (groupExpenseTotal > 0) {
      categoryTotals["group-expenses"] = groupExpenseTotal;
    }

    // Prepare for chart
    const categoryChartData = Object.entries(categoryTotals)
      .map(([categoryId, value]) => {
        if (categoryId === "group-expenses") {
          return {
            name: "Group Expenses",
            value,
            color: "#9b87f5" // distinctive color
          };
        }
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category ? category.name : "Unknown",
          value,
          color: category ? category.color : "#cccccc"
        };
      })
      .sort((a, b) => b.value - a.value);

    setCategoryData(categoryChartData);

    // --- Time Series Data (Personal + sum of user's share in Group) ---
    // Construct an array of { date, amount }
    let labels: string[] = [];
    let rangeDates: Date[] = [];
    if (timeframe === "week") {
      // Last 7 days
      rangeDates = Array.from({ length: 7 }).map((_, i) => subDays(now, 6 - i));
      labels = rangeDates.map((date) => format(date, "EEE"));
    } else if (timeframe === "month") {
      // 4 weeks (split current month into 4 weeks ~7-day blocks)
      const daysInMonth = endOfMonth(now).getDate();
      rangeDates = Array.from({ length: 4 }).map((_, i) => {
        const start = new Date(now);
        start.setDate(1 + i * 7);
        return start;
      });
      labels = rangeDates.map((date, i) => `Week ${i + 1}`);
    } else if (timeframe === "year") {
      // Each month
      rangeDates = Array.from({ length: 12 }).map((_, i) => new Date(now.getFullYear(), i, 1));
      labels = rangeDates.map((date) => format(date, "MMM"));
    }

    // Bucketize expenses by time
    let timeBuckets: { [bucket: string]: number } = {};
    if (timeframe === "week") {
      // Initialize
      labels.forEach((label) => (timeBuckets[label] = 0));
      rangeDates.forEach((targetDate, idx) => {
        // Personal
        filteredExpenses.forEach((exp) => {
          const d = new Date(exp.date);
          if (
            d.getDate() === targetDate.getDate() &&
            d.getMonth() === targetDate.getMonth() &&
            d.getFullYear() === targetDate.getFullYear()
          ) {
            timeBuckets[labels[idx]] += exp.amount;
          }
        });
        // Group (user's share)
        filteredGroupExpenses.forEach((gexp) => {
          const g = new Date(gexp.date);
          if (
            g.getDate() === targetDate.getDate() &&
            g.getMonth() === targetDate.getMonth() &&
            g.getFullYear() === targetDate.getFullYear()
          ) {
            const userShare = gexp.splits.find((split) => split.userId === user.id)?.amount || 0;
            timeBuckets[labels[idx]] += userShare;
          }
        });
      });
    } else if (timeframe === "month") {
      // Week buckets
      labels.forEach(label => (timeBuckets[label] = 0));
      rangeDates.forEach((rangeStart, idx) => {
        const rangeEnd = new Date(now);
        rangeEnd.setDate(1 + (idx + 1) * 7 - 1);
        // Personal
        filteredExpenses.forEach(exp => {
          const d = new Date(exp.date);
          if (d >= rangeStart && d <= rangeEnd) {
            timeBuckets[labels[idx]] += exp.amount;
          }
        });
        // Group
        filteredGroupExpenses.forEach(gexp => {
          const g = new Date(gexp.date);
          if (g >= rangeStart && g <= rangeEnd) {
            const userShare = gexp.splits.find(split => split.userId === user.id)?.amount || 0;
            timeBuckets[labels[idx]] += userShare;
          }
        });
      });
    } else if (timeframe === "year") {
      // Month buckets
      labels.forEach(label => (timeBuckets[label] = 0));
      rangeDates.forEach((monthStart, idx) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        filteredExpenses.forEach(exp => {
          const d = new Date(exp.date);
          if (d >= monthStart && d <= monthEnd) {
            timeBuckets[labels[idx]] += exp.amount;
          }
        });
        filteredGroupExpenses.forEach(gexp => {
          const g = new Date(gexp.date);
          if (g >= monthStart && g <= monthEnd) {
            const userShare = gexp.splits.find(split => split.userId === user.id)?.amount || 0;
            timeBuckets[labels[idx]] += userShare;
          }
        });
      });
    }

    // Convert to timeData
    setTimeData(labels.map(label => ({ date: label, amount: timeBuckets[label] })));
  }, [expenses, groupExpenses, categories, timeframe, user]);

  // --- Consistency Validation: show console warnings if group expenses are not reflected correctly ---
  useEffect(() => {
    if (groupExpenses.length > 0) {
      const groupEntry = categoryData.find(cat => cat.name === "Group Expenses");
      if (!groupEntry || groupEntry.value === 0) {
        console.warn("Data validation: Group expenses are not being captured in reports. Please review calculations.");
      }
    }
  }, [categoryData, groupExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <Select value={timeframe} onValueChange={(value: "week" | "month" | "year") => setTimeframe(value)}>
          <SelectTrigger className="w-[180px] bg-[#2D2D2D] border-[#3A3A3A] text-white">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white z-50">
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
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{textShadow: "1.5px 2px 7px #000"}}>
              {formatIndianCurrency(total)}
            </div>
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
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{textShadow: "1.5px 2px 7px #000"}}>
              {categoryData.length}
            </div>
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
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{textShadow: "1.5px 2px 7px #000"}}>
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
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="pie-3d-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="10%" stopColor="#9b87f5" />
                      <stop offset="80%" stopColor="#221F26" />
                    </linearGradient>
                    <filter id="text-shadow" x="-100%" y="-100%" width="300%" height="300%">
                      <feDropShadow dx="1.5" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.8"/>
                    </filter>
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="47%"
                    labelLine={false}
                    outerRadius={95}
                    innerRadius={40}
                    stroke="#2D2D2D"
                    dataKey="value"
                    label={({ name, percent }) => (
                      <tspan style={{
                        fill: "#FFF",
                        fontWeight: 800,
                        fontSize: 16,
                        filter: "url(#text-shadow)",
                        paintOrder: "stroke",
                        stroke: "#000",
                        strokeWidth: "2"
                      }}>
                        {name} {(percent * 100).toFixed(0)}%
                      </tspan>
                    )}
                    style={{filter: "drop-shadow(0 6px 13px #19192177)"}}
                    {...pie3DGradient}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color === "#9b87f5" ? "url(#pie-3d-gradient)" : entry.color} 
                        style={{
                          filter: "drop-shadow(3px 8px 12px #111A4422)",
                          stroke: "#353159",
                          strokeWidth: 2
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatIndianCurrency(value as number)} 
                    contentStyle={{
                      background: "#2D2D2D",
                      borderColor: "#9b87f5",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px #19192188"
                    }}
                    labelStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 15,
                      textShadow: "1px 1px 6px #000"
                    }}
                    itemStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 14,
                      textShadow: "1px 1px 7px #000"
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 18, color: "#FFF" }}
                    formatter={(value) => (
                      <span
                        style={{
                          color: "#FFF",
                          fontWeight: 700,
                          fontSize: 15,
                          textShadow: "1px 2px 7px #000"
                        }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">
              Spending Over Time ({timeframe === "week" ? "Daily" : timeframe === "month" ? "Weekly" : "Monthly"})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {timeData.length > 0 && timeData.some(item => item.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <defs>
                    <linearGradient id="bar-3d-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9b87f5" />
                      <stop offset="80%" stopColor="#221F26" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0 6" stroke="#3A3A3A" opacity={0.25} />
                  <XAxis dataKey="date" stroke="#E0E0E0" />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip 
                    formatter={(value) => formatIndianCurrency(value as number)}
                    contentStyle={{
                      background: "#2D2D2D",
                      borderColor: "#9b87f5",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px #19192188"
                    }}
                    labelStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 15,
                      textShadow: "1.5px 2px 7px #000"
                    }}
                    itemStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 14,
                      textShadow: "1px 2px 7px #000"
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[12, 12, 2, 2]}
                    {...bar3DGradient}
                    style={{
                      filter: "drop-shadow(0 8px 16px #4b40a666)",
                    }}
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

      <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-2xl">
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
                      <span className="text-white font-bold drop-shadow" style={{
                        textShadow: "1.5px 2px 7px #000",
                        fontSize: "1.1rem"
                      }}>{category.name}</span>
                    </div>
                    <span className="font-semibold text-white drop-shadow" style={{
                      textShadow: "1.5px 2px 8px #000",
                      fontSize: "1.1rem"
                    }}>
                      {formatIndianCurrency(category.value)}
                    </span>
                  </div>
                  <div className="h-2 bg-[#3A3A3A] rounded-full">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(category.value / total) * 100}%`,
                        background: category.name === "Group Expenses" ? "linear-gradient(90deg, #abecd6, #9b87f5)" : category.color,
                        boxShadow: "0 1px 8px 0px #8e43e272"
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right" style={{
                    textShadow: "1.5px 2px 7px #000"
                  }}>
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

// WARNING: src/pages/Reports.tsx is now getting quite long. Please consider refactoring into smaller components and utilities for easier maintenance and readability.
