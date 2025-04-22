
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
  SharedExpense,
  Group
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
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isWithinInterval, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { CalendarRange, ChartBar, ChartPie } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentGroupExpenses, setRecentGroupExpenses] = useState<SharedExpense[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string, value: number, color: string }[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<{ name: string, amount: number }[]>([]);
  const [timeFilter, setTimeFilter] = useState<"month" | "year">("month");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalGroupExpenses, setTotalGroupExpenses] = useState(0);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  
  const loadData = () => {
    if (!user) return;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodType: "day" | "month" | "year";

    switch (timeFilter) {
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        periodType = "month";
        break;
      case "month":
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        periodType = "day";
    }
    
    const groups = getUserGroups(user.id);
    setUserGroups(groups);
    
    let personalExpenses = getExpensesByPeriod(user.id, periodType);
    
    const filteredPersonalExpenses = getCurrentMonthExpenses(user.id).filter(exp => {
      const expDate = new Date(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate });
    });
    
    let personalTotal = filteredPersonalExpenses.reduce((total, expense) => total + expense.amount, 0);
    
    let groupExpensesTotal = 0;
    let allGroupExpenses: SharedExpense[] = [];
    let filteredGroupExpenses: SharedExpense[] = [];
    
    groups.forEach(group => {
      const groupExpenses = getGroupExpenses(group.id);
      allGroupExpenses = [...allGroupExpenses, ...groupExpenses];
      
      const filteredExpenses = groupExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return isWithinInterval(expDate, { start: startDate, end: endDate });
      });
      
      filteredGroupExpenses = [...filteredGroupExpenses, ...filteredExpenses];
      
      filteredExpenses.forEach(expense => {
        const userSplit = expense.splits.find(split => split.userId === user.id);
        if (userSplit) {
          groupExpensesTotal += userSplit.amount;
        }
      });
    });
    
    setTotalGroupExpenses(groupExpensesTotal);
    
    const combinedTotal = personalTotal + groupExpensesTotal;
    setMonthlyTotal(combinedTotal);
    setTotalExpenses(combinedTotal);
    
    const sortedGroupExpenses = filteredGroupExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    setRecentGroupExpenses(sortedGroupExpenses);
    
    setRecentExpenses(filteredPersonalExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    );
    
    const categories = getCategories(user.id);
    
    const categoryTotals = getCategoryTotals(user.id, timeFilter);
    
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
    
    if (groupExpensesTotal > 0) {
      categoryChartData.push({
        name: "Group Expenses",
        value: groupExpensesTotal,
        color: "#9b87f5",
      });
    }
    
    setCategoryData(categoryChartData);

    // Generate time labels for month and year only
    const generateTimeLabels = () => {
      if (timeFilter === "year") {
        return Array.from({ length: 12 }).map((_, i) => {
          const date = new Date(now.getFullYear(), i, 1);
          return {
            date: date,
            displayName: format(date, "MMM"),
            dateKey: format(date, "yyyy-MM")
          };
        });
      } else {
        const daysInMonth = endOfMonth(now).getDate();
        return Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
          return {
            date: date,
            displayName: format(date, "dd"),
            dateKey: format(date, "yyyy-MM-dd")
          };
        });
      }
    };
    
    const getExpenseHistoryData = () => {
      const personalExpensesByDate: Record<string, number> = {};
      filteredPersonalExpenses.forEach(expense => {
        const expDate = new Date(expense.date);
        let dateKey: string;
        
        if (timeFilter === "month") {
          dateKey = format(expDate, "yyyy-MM-dd");
        } else {
          dateKey = format(expDate, "yyyy-MM");
        }
        
        if (!personalExpensesByDate[dateKey]) {
          personalExpensesByDate[dateKey] = 0;
        }
        personalExpensesByDate[dateKey] += expense.amount;
      });
      
      const groupExpensesByDate: Record<string, number> = {};
      filteredGroupExpenses.forEach(expense => {
        const expDate = new Date(expense.date);
        let dateKey: string;
        
        if (timeFilter === "month") {
          dateKey = format(expDate, "yyyy-MM-dd");
        } else {
          dateKey = format(expDate, "yyyy-MM");
        }
        
        const userShare = expense.splits.find(split => split.userId === user.id)?.amount || 0;
        
        if (!groupExpensesByDate[dateKey]) {
          groupExpensesByDate[dateKey] = 0;
        }
        groupExpensesByDate[dateKey] += userShare;
      });
      
      const combinedExpenses: Record<string, number> = {};
      
      Object.entries(personalExpensesByDate).forEach(([date, amount]) => {
        combinedExpenses[date] = (combinedExpenses[date] || 0) + amount;
      });
      
      Object.entries(groupExpensesByDate).forEach(([date, amount]) => {
        combinedExpenses[date] = (combinedExpenses[date] || 0) + amount;
      });
      
      const timeLabels = generateTimeLabels();
      return timeLabels.map(({ displayName, dateKey }) => ({
        name: displayName,
        amount: combinedExpenses[dateKey] || 0
      }));
    };
    
    setExpenseHistory(getExpenseHistoryData());
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
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg transform transition-transform hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              {timeFilter === "year" ? "This Year" : "This Month"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{textShadow: '1.5px 1.5px 3px #000, 0 0 8px #0007'}}>
              {formatCurrency(monthlyTotal)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {timeFilter === "year" 
                ? format(new Date(), "yyyy")
                : format(new Date(), "MMMM yyyy")}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-400">Personal</span>
                <span className="text-white font-semibold drop-shadow" style={{textShadow: "0 0 6px #111,0 0 2px #0008"}}>{formatCurrency(monthlyTotal - totalGroupExpenses)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Group</span>
                <span className="text-white font-semibold drop-shadow" style={{textShadow: "0 0 6px #111,0 0 2px #0008"}}>{formatCurrency(totalGroupExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg transform transition-transform hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{textShadow: '1.5px 1.5px 3px #000,0 0 8px #0007'}}>
              {categoryData.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Active Categories
            </p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-400">Personal</span>
                <span className="text-white font-semibold">{categoryData.filter(c => c.name !== "Group Expenses").length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Groups</span>
                <span className="text-white font-semibold">{userGroups.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg transform transition-transform hover:scale-105">
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
              {timeFilter === "month" ? "This Month" : "This Year"}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-400">Personal</span>
                <span className="text-white font-semibold">{recentExpenses.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">Group</span>
                <span className="text-white font-semibold">{recentGroupExpenses.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg font-bold">
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
                    outerRadius={90}
                    innerRadius={30}
                    paddingAngle={5}
                    fill="#8884d8"
                    dataKey="value"
                    // Update label style for higher visibility
                    label={({ name, percent }) => (
                      <tspan style={{
                        fill: "#FFF",
                        fontWeight: 700,
                        fontSize: 15,
                        textShadow: "1px 1.5px 6px #000"
                      }}>
                        {name} {(percent * 100).toFixed(0)}%
                      </tspan>
                    )}
                    className="drop-shadow-xl"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{ 
                          filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5))',
                          stroke: '#1A1A1A',
                          strokeWidth: 1
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: '#2D2D2D',
                      borderColor: '#3A3A3A',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                    }}
                    labelStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 15,
                      textShadow: "1px 1px 6px #000"
                    }}
                    itemStyle={{
                      color: "#FFF",
                      fontWeight: 600,
                      fontSize: 14,
                      textShadow: "1px 1px 6px #000"
                    }}
                  />
                  <Legend
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
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: "20px"
                    }}
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
        
        <Card className="col-span-1 bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg font-bold">
              <ChartBar className="h-5 w-5 mr-2" /> 
              {timeFilter === "year" ? "Monthly" : "Daily"} Expenses
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
                    labelStyle={{
                      color: "#FFF",
                      fontWeight: 800,
                      fontSize: 15,
                      textShadow: "1px 1px 7px #000"
                    }}
                    itemStyle={{
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 14,
                      textShadow: "1px 1.5px 7px #000"
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#9b87f5" 
                    radius={[8, 8, 0, 0]}
                    style={{ 
                      filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5))'
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
      
      <Card className="bg-[#2D2D2D] border-[#3A3A3A] shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-xl font-bold">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 || recentGroupExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between border-b border-[#3A3A3A] pb-3 hover:bg-[#3A3A3A]/20 p-2 rounded-md transition-colors"
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
              
              {recentGroupExpenses.map((expense) => {
                const userShare = expense.splits.find(split => split.userId === user?.id)?.amount || 0;
                return (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between border-b border-[#3A3A3A] pb-3 hover:bg-[#3A3A3A]/20 p-2 rounded-md transition-colors"
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
