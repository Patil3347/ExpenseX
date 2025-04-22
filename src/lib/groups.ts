
import { toast } from "@/components/ui/use-toast";
import { User } from "@/lib/auth";

export interface GroupMember {
  userId: string;
  displayName: string;
  avatar?: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
}

export interface SharedExpense {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  date: string;
  paidBy: string;
  createdAt: string;
  updatedAt: string;
  splits: ExpenseSplit[];
  settled: boolean;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  settled: boolean;
}

export interface Balance {
  userId: string;
  otherUserId: string;
  amount: number; // Positive means userId owes otherUserId
}

// Helper to initialize localStorage if needed
function initializeLocalStorage(key: string, defaultValue: any): void {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
  }
}

// Get all groups for a user
export function getUserGroups(userId: string): Group[] {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    if (groups) {
      const parsedGroups = JSON.parse(groups) as Group[];
      return parsedGroups.filter(group => 
        group.members.some(member => member.userId === userId)
      );
    }
    return [];
  } catch (error) {
    console.error("Failed to get groups:", error);
    return [];
  }
}

// Get a specific group
export function getGroup(groupId: string): Group | undefined {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    if (groups) {
      const parsedGroups = JSON.parse(groups) as Group[];
      return parsedGroups.find(group => group.id === groupId);
    }
    return undefined;
  } catch (error) {
    console.error(`Failed to get group ${groupId}:`, error);
    return undefined;
  }
}

// Create a new group
export function createGroup(name: string, description: string, createdBy: User): Group {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    const existingGroups = groups ? JSON.parse(groups) as Group[] : [];
    
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      description,
      createdBy: createdBy.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        {
          userId: createdBy.id,
          displayName: createdBy.name,
          avatar: createdBy.avatar,
          joinedAt: new Date().toISOString(),
        }
      ]
    };
    
    existingGroups.push(newGroup);
    localStorage.setItem(`groups`, JSON.stringify(existingGroups));
    
    toast({
      title: "Group created",
      description: `${name} has been created successfully`,
    });
    
    return newGroup;
  } catch (error) {
    console.error("Failed to create group:", error);
    toast({
      variant: "destructive",
      title: "Failed to create group",
      description: "There was an error creating your group",
    });
    throw error;
  }
}

// Add a member to a group
export function addGroupMember(groupId: string, member: GroupMember): Group | undefined {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    if (!groups) return undefined;
    
    const parsedGroups = JSON.parse(groups) as Group[];
    const groupIndex = parsedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return undefined;
    
    // Check if member already exists
    if (parsedGroups[groupIndex].members.some(m => m.userId === member.userId)) {
      toast({
        variant: "destructive",
        title: "Member already exists",
        description: "This user is already a member of the group",
      });
      return parsedGroups[groupIndex];
    }
    
    parsedGroups[groupIndex].members.push({
      ...member,
      joinedAt: new Date().toISOString(),
    });
    parsedGroups[groupIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem(`groups`, JSON.stringify(parsedGroups));
    
    toast({
      title: "Member added",
      description: `${member.displayName} has been added to the group`,
    });
    
    return parsedGroups[groupIndex];
  } catch (error) {
    console.error(`Failed to add member to group ${groupId}:`, error);
    toast({
      variant: "destructive",
      title: "Failed to add member",
      description: "There was an error adding the member to your group",
    });
    return undefined;
  }
}

// Remove a member from a group
export function removeGroupMember(groupId: string, userId: string): Group | undefined {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    if (!groups) return undefined;
    
    const parsedGroups = JSON.parse(groups) as Group[];
    const groupIndex = parsedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return undefined;
    
    // Get member name before removing
    const memberToRemove = parsedGroups[groupIndex].members.find(m => m.userId === userId);
    if (!memberToRemove) return parsedGroups[groupIndex];
    
    parsedGroups[groupIndex].members = parsedGroups[groupIndex].members.filter(
      member => member.userId !== userId
    );
    parsedGroups[groupIndex].updatedAt = new Date().toISOString();
    
    // If no members left, delete the group
    if (parsedGroups[groupIndex].members.length === 0) {
      const updatedGroups = parsedGroups.filter(g => g.id !== groupId);
      localStorage.setItem(`groups`, JSON.stringify(updatedGroups));
      
      toast({
        title: "Group deleted",
        description: "Group has been deleted as it has no members",
      });
      return undefined;
    }
    
    localStorage.setItem(`groups`, JSON.stringify(parsedGroups));
    
    toast({
      title: "Member removed",
      description: `${memberToRemove.displayName} has been removed from the group`,
    });
    
    return parsedGroups[groupIndex];
  } catch (error) {
    console.error(`Failed to remove member from group ${groupId}:`, error);
    toast({
      variant: "destructive",
      title: "Failed to remove member",
      description: "There was an error removing the member from your group",
    });
    return undefined;
  }
}

// Delete a group
export function deleteGroup(groupId: string): boolean {
  try {
    // Initialize groups storage if it doesn't exist
    initializeLocalStorage('groups', []);
    
    const groups = localStorage.getItem(`groups`);
    if (!groups) return false;
    
    const parsedGroups = JSON.parse(groups) as Group[];
    const filteredGroups = parsedGroups.filter(g => g.id !== groupId);
    
    localStorage.setItem(`groups`, JSON.stringify(filteredGroups));
    
    // Also delete all expenses for this group
    // Initialize shared-expenses storage if it doesn't exist
    initializeLocalStorage('shared-expenses', []);
    
    const expenses = localStorage.getItem(`shared-expenses`);
    if (expenses) {
      const parsedExpenses = JSON.parse(expenses) as SharedExpense[];
      const filteredExpenses = parsedExpenses.filter(e => e.groupId !== groupId);
      localStorage.setItem(`shared-expenses`, JSON.stringify(filteredExpenses));
    }
    
    toast({
      title: "Group deleted",
      description: "Group has been deleted successfully",
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to delete group ${groupId}:`, error);
    toast({
      variant: "destructive",
      title: "Failed to delete group",
      description: "There was an error deleting your group",
    });
    return false;
  }
}

// Add a shared expense to a group
export function addSharedExpense(expense: Omit<SharedExpense, "id" | "createdAt" | "updatedAt" | "settled">): SharedExpense {
  try {
    // Initialize shared-expenses storage if it doesn't exist
    initializeLocalStorage('shared-expenses', []);
    
    const expenses = localStorage.getItem(`shared-expenses`);
    const existingExpenses = expenses ? JSON.parse(expenses) as SharedExpense[] : [];
    
    const newExpense: SharedExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settled: false,
    };
    
    existingExpenses.push(newExpense);
    localStorage.setItem(`shared-expenses`, JSON.stringify(existingExpenses));
    
    toast({
      title: "Expense added",
      description: "Your shared expense has been added successfully",
    });
    
    return newExpense;
  } catch (error) {
    console.error("Failed to add shared expense:", error);
    toast({
      variant: "destructive",
      title: "Failed to add expense",
      description: "There was an error adding your shared expense",
    });
    throw error;
  }
}

// Get all expenses for a group
export function getGroupExpenses(groupId: string): SharedExpense[] {
  try {
    // Initialize shared-expenses storage if it doesn't exist
    initializeLocalStorage('shared-expenses', []);
    
    const expenses = localStorage.getItem(`shared-expenses`);
    if (expenses) {
      const parsedExpenses = JSON.parse(expenses) as SharedExpense[];
      return parsedExpenses.filter(expense => expense.groupId === groupId);
    }
    return [];
  } catch (error) {
    console.error(`Failed to get expenses for group ${groupId}:`, error);
    return [];
  }
}

// Calculate balances between group members
export function calculateBalances(groupId: string): Balance[] {
  const expenses = getGroupExpenses(groupId);
  const group = getGroup(groupId);
  
  if (!group) return [];
  
  // For each user, track how much they've paid and how much they owe
  const netBalances: Record<string, number> = {};
  
  // Initialize net balances for all members
  group.members.forEach(member => {
    netBalances[member.userId] = 0;
  });
  
  // Calculate net balances from all expenses
  expenses.forEach(expense => {
    if (expense.settled) return;
    
    // Add the full amount to the payer
    netBalances[expense.paidBy] += expense.amount;
    
    // Subtract each person's share
    expense.splits.forEach(split => {
      netBalances[split.userId] -= split.amount;
    });
  });
  
  // Convert net balances to pairwise balances
  const balances: Balance[] = [];
  const members = group.members.map(m => m.userId);
  
  // Create all possible pairs of members
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const user1 = members[i];
      const user2 = members[j];
      
      // Calculate relative balance
      const balance = netBalances[user1] - netBalances[user2];
      
      if (balance > 0) {
        // User2 owes User1
        balances.push({
          userId: user2,
          otherUserId: user1,
          amount: balance / 2, // Divide by 2 because we counted the full amount twice
        });
      } else if (balance < 0) {
        // User1 owes User2
        balances.push({
          userId: user1,
          otherUserId: user2,
          amount: -balance / 2, // Convert negative to positive, divide by 2
        });
      }
      // If balance is 0, no debt exists
    }
  }
  
  return balances;
}

// Mark an expense as settled
export function settleExpense(expenseId: string): SharedExpense | undefined {
  try {
    // Initialize shared-expenses storage if it doesn't exist
    initializeLocalStorage('shared-expenses', []);
    
    const expenses = localStorage.getItem(`shared-expenses`);
    if (!expenses) return undefined;
    
    const parsedExpenses = JSON.parse(expenses) as SharedExpense[];
    const expenseIndex = parsedExpenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex === -1) return undefined;
    
    parsedExpenses[expenseIndex].settled = true;
    parsedExpenses[expenseIndex].updatedAt = new Date().toISOString();
    
    // Mark all splits as settled too
    parsedExpenses[expenseIndex].splits = parsedExpenses[expenseIndex].splits.map(
      split => ({ ...split, settled: true })
    );
    
    localStorage.setItem(`shared-expenses`, JSON.stringify(parsedExpenses));
    
    toast({
      title: "Expense settled",
      description: "The expense has been marked as settled",
    });
    
    return parsedExpenses[expenseIndex];
  } catch (error) {
    console.error(`Failed to settle expense ${expenseId}:`, error);
    toast({
      variant: "destructive",
      title: "Failed to settle expense",
      description: "There was an error settling the expense",
    });
    return undefined;
  }
}

// Format currency (reused from expenses.ts)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
