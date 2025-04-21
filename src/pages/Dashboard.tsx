
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getCurrentMonthTotal, 
  getCurrentMonthExpenses, 
  getExpensesByPeriod,
  getCategoryTotals,
  getCategories,
  formatCurrency,
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active Categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentExpenses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This Month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
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
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {expenseHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseHistory}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#9b87f5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between border-b border-gray-100 pb-2"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No recent expenses
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
