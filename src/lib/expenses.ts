import { toast } from "@/components/ui/use-toast";
import { formatIndianCurrency } from "@/lib/utils";

// Types
export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
}

// Default categories
export const defaultCategories: Omit<Category, "userId">[] = [
  { id: "cat-1", name: "Food & Dining", color: "#FF6B6B", icon: "utensils" },
  { id: "cat-2", name: "Transportation", color: "#48BEFF", icon: "car" },
  { id: "cat-3", name: "Housing", color: "#4E67EB", icon: "home" },
  { id: "cat-4", name: "Entertainment", color: "#9C62FF", icon: "film" },
  { id: "cat-5", name: "Shopping", color: "#FF8F6B", icon: "shopping-bag" },
  { id: "cat-6", name: "Utilities", color: "#4BD4A0", icon: "bolt" },
  { id: "cat-7", name: "Healthcare", color: "#FF6BB5", icon: "heart" },
  { id: "cat-8", name: "Other", color: "#8E9196", icon: "ellipsis-h" },
];

// Utility functions to get expenses and categories
export function getExpenses(userId: string): Expense[] {
  try {
    const expenses = localStorage.getItem(`expenses-${userId}`);
    return expenses ? JSON.parse(expenses) : [];
  } catch (error) {
    console.error("Failed to get expenses:", error);
    return [];
  }
}

export function getCategories(userId: string): Category[] {
  try {
    const categories = localStorage.getItem(`categories-${userId}`);
    if (categories) {
      return JSON.parse(categories);
    } else {
      // Initialize with default categories if none exist
      const userCategories = defaultCategories.map(cat => ({
        ...cat,
        userId
      }));
      localStorage.setItem(`categories-${userId}`, JSON.stringify(userCategories));
      return userCategories;
    }
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}

// CRUD operations for expenses
export function addExpense(expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  try {
    const expenses = getExpenses(expense.userId);
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    expenses.push(newExpense);
    localStorage.setItem(`expenses-${expense.userId}`, JSON.stringify(expenses));
    
    toast({
      title: "Expense added",
      description: "Your expense has been added successfully",
    });
    
    return newExpense;
  } catch (error) {
    console.error("Failed to add expense:", error);
    toast({
      variant: "destructive",
      title: "Failed to add expense",
      description: "There was an error adding your expense",
    });
    throw error;
  }
}

export function updateExpense(expense: Expense) {
  try {
    const expenses = getExpenses(expense.userId);
    const index = expenses.findIndex(e => e.id === expense.id);
    
    if (index === -1) {
      throw new Error("Expense not found");
    }
    
    expenses[index] = {
      ...expense,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`expenses-${expense.userId}`, JSON.stringify(expenses));
    
    toast({
      title: "Expense updated",
      description: "Your expense has been updated successfully",
    });
    
    return expenses[index];
  } catch (error) {
    console.error("Failed to update expense:", error);
    toast({
      variant: "destructive",
      title: "Failed to update expense",
      description: "There was an error updating your expense",
    });
    throw error;
  }
}

export function deleteExpense(expenseId: string, userId: string) {
  try {
    const expenses = getExpenses(userId);
    const filteredExpenses = expenses.filter(e => e.id !== expenseId);
    
    localStorage.setItem(`expenses-${userId}`, JSON.stringify(filteredExpenses));
    
    toast({
      title: "Expense deleted",
      description: "Your expense has been deleted successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Failed to delete expense:", error);
    toast({
      variant: "destructive",
      title: "Failed to delete expense",
      description: "There was an error deleting your expense",
    });
    throw error;
  }
}

// CRUD operations for categories
export function addCategory(category: Omit<Category, "id">) {
  try {
    const categories = getCategories(category.userId);
    
    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
      toast({
        variant: "destructive",
        title: "Category already exists",
        description: "A category with this name already exists",
      });
      throw new Error("Category already exists");
    }
    
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    
    categories.push(newCategory);
    localStorage.setItem(`categories-${category.userId}`, JSON.stringify(categories));
    
    toast({
      title: "Category added",
      description: "Your category has been added successfully",
    });
    
    return newCategory;
  } catch (error) {
    console.error("Failed to add category:", error);
    throw error;
  }
}

export function updateCategory(category: Category) {
  try {
    const categories = getCategories(category.userId);
    const index = categories.findIndex(c => c.id === category.id);
    
    if (index === -1) {
      throw new Error("Category not found");
    }
    
    // Check for duplicates (excluding the current category)
    if (categories.some(c => 
      c.id !== category.id && 
      c.name.toLowerCase() === category.name.toLowerCase()
    )) {
      toast({
        variant: "destructive",
        title: "Category already exists",
        description: "A category with this name already exists",
      });
      throw new Error("Category already exists");
    }
    
    categories[index] = category;
    localStorage.setItem(`categories-${category.userId}`, JSON.stringify(categories));
    
    toast({
      title: "Category updated",
      description: "Your category has been updated successfully",
    });
    
    return categories[index];
  } catch (error) {
    console.error("Failed to update category:", error);
    throw error;
  }
}

export function deleteCategory(categoryId: string, userId: string) {
  try {
    const categories = getCategories(userId);
    
    // Don't delete if it's the last category
    if (categories.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot delete category",
        description: "You must have at least one category",
      });
      throw new Error("Cannot delete the last category");
    }
    
    const filteredCategories = categories.filter(c => c.id !== categoryId);
    
    // Handle expenses with this category - reassign to "Other"
    const expenses = getExpenses(userId);
    const otherCategory = categories.find(c => c.name === "Other") || categories[0];
    
    const updatedExpenses = expenses.map(expense => {
      if (expense.categoryId === categoryId) {
        return {
          ...expense,
          categoryId: otherCategory.id,
          updatedAt: new Date().toISOString(),
        };
      }
      return expense;
    });
    
    localStorage.setItem(`categories-${userId}`, JSON.stringify(filteredCategories));
    localStorage.setItem(`expenses-${userId}`, JSON.stringify(updatedExpenses));
    
    toast({
      title: "Category deleted",
      description: "Your category has been deleted successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
}

// Analytics functions
export function getMonthlyExpenses(userId: string, year: number, month: number): Expense[] {
  const expenses = getExpenses(userId);
  
  return expenses.filter(expense => {
    const date = new Date(expense.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

export function getCategoryTotals(userId: string, timeframe: string = "month"): Record<string, number> {
  const expenses = getExpenses(userId);
  const categories = getCategories(userId);
  
  // Filter expenses based on timeframe
  let filteredExpenses = expenses;
  const now = new Date();
  
  if (timeframe === "month") {
    filteredExpenses = expenses.filter(expense => {
      const date = new Date(expense.date);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    });
  } else if (timeframe === "year") {
    filteredExpenses = expenses.filter(expense => {
      const date = new Date(expense.date);
      return date.getFullYear() === now.getFullYear();
    });
  }
  
  // Calculate totals by category
  const totals: Record<string, number> = {};
  
  categories.forEach(category => {
    totals[category.id] = 0;
  });
  
  filteredExpenses.forEach(expense => {
    if (totals[expense.categoryId] !== undefined) {
      totals[expense.categoryId] += expense.amount;
    }
  });
  
  return totals;
}

export function getExpensesByPeriod(userId: string, period: string = "month"): { date: string, total: number }[] {
  const expenses = getExpenses(userId);
  const periodData: Record<string, number> = {};
  
  expenses.forEach(expense => {
    let periodKey: string;
    const date = new Date(expense.date);
    
    if (period === "day") {
      periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } else if (period === "month") {
      periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (period === "year") {
      periodKey = `${date.getFullYear()}`;
    } else {
      return;
    }
    
    if (!periodData[periodKey]) {
      periodData[periodKey] = 0;
    }
    
    periodData[periodKey] += expense.amount;
  });
  
  // Convert to array format
  return Object.entries(periodData).map(([date, total]) => ({ date, total }));
}

// Date utilities for expenses
export function getCurrentMonthExpenses(userId: string): Expense[] {
  const now = new Date();
  return getMonthlyExpenses(userId, now.getFullYear(), now.getMonth());
}

export function getCurrentMonthTotal(userId: string): number {
  const expenses = getCurrentMonthExpenses(userId);
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function formatCurrency(amount: number): string {
  return formatIndianCurrency(amount);
}
