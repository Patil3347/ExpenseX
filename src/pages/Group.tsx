import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Users, 
  UserPlus, 
  UserMinus, 
  DollarSign, 
  Check,
  ArrowLeft
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  Group,
  GroupMember, 
  SharedExpense, 
  Balance,
  getGroup, 
  addGroupMember, 
  removeGroupMember,
  addSharedExpense,
  getGroupExpenses,
  calculateBalances,
  settleExpense,
  formatCurrency
} from "@/lib/groups";

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  paidBy: z.string({ required_error: "Please select who paid" }),
});

const memberFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const expenseForm = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paidBy: user?.id || "",
    },
  });

  const memberForm = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user && groupId) {
      loadGroupData();
    } else if (!user) {
      navigate("/login");
    }
  }, [user, groupId, navigate]);

  const loadGroupData = () => {
    if (!groupId || !user) return;
    
    setIsLoading(true);
    try {
      console.log("Loading group data for groupId:", groupId);
      const groupData = getGroup(groupId);
      console.log("Group data loaded:", groupData);
      
      if (!groupData) {
        toast({
          variant: "destructive",
          title: "Group not found",
          description: "The requested group could not be found.",
        });
        navigate("/groups");
        return;
      }
      
      if (!groupData.members.some(m => m.userId === user.id)) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You are not a member of this group.",
        });
        navigate("/groups");
        return;
      }
      
      setGroup(groupData);
      
      const expensesData = getGroupExpenses(groupId);
      console.log("Group expenses loaded:", expensesData);
      setExpenses(expensesData);
      
      const balancesData = calculateBalances(groupId);
      console.log("Group balances calculated:", balancesData);
      setBalances(balancesData);
    } catch (error) {
      console.error("Error loading group data:", error);
      toast({
        variant: "destructive",
        title: "Error loading group",
        description: "There was a problem loading the group data.",
      });
      navigate("/groups");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const onAddExpense = (values: z.infer<typeof expenseFormSchema>) => {
    if (!user || !groupId || !group) return;

    try {
      const amount = parseFloat(values.amount);
      const splitAmount = amount / group.members.length;
      
      const splits = group.members.map(member => ({
        userId: member.userId,
        amount: splitAmount,
        settled: false,
      }));

      addSharedExpense({
        groupId,
        amount,
        description: values.description,
        date: new Date(values.date).toISOString(),
        paidBy: values.paidBy,
        splits,
      });
      
      loadGroupData();
      setIsExpenseDialogOpen(false);
      expenseForm.reset({
        description: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        paidBy: user.id,
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "Error adding expense",
        description: "There was a problem adding the expense to your group.",
      });
    }
  };

  const onAddMember = (values: z.infer<typeof memberFormSchema>) => {
    if (!groupId) return;

    try {
      const mockUserId = `user-${Date.now()}`;
      
      const newMember: GroupMember = {
        userId: mockUserId,
        displayName: values.name,
        joinedAt: new Date().toISOString(),
      };
      
      addGroupMember(groupId, newMember);
      loadGroupData();
      setIsMemberDialogOpen(false);
      memberForm.reset();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        variant: "destructive",
        title: "Error adding member",
        description: "There was a problem adding the member to your group.",
      });
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (!groupId || userId === user?.id) return;
    
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        removeGroupMember(groupId, userId);
        loadGroupData();
      } catch (error) {
        console.error("Error removing member:", error);
        toast({
          variant: "destructive",
          title: "Error removing member",
          description: "There was a problem removing the member from your group.",
        });
      }
    }
  };

  const handleSettleExpense = (expenseId: string) => {
    if (window.confirm("Mark this expense as settled?")) {
      try {
        settleExpense(expenseId);
        loadGroupData();
      } catch (error) {
        console.error("Error settling expense:", error);
        toast({
          variant: "destructive",
          title: "Error settling expense",
          description: "There was a problem marking the expense as settled.",
        });
      }
    }
  };

  const getMemberName = (userId: string) => {
    const member = group?.members.find(m => m.userId === userId);
    return member ? member.displayName : "Unknown";
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const activeExpenses = expenses.filter(expense => !expense.settled);
  const settledExpenses = expenses.filter(expense => expense.settled);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading group data...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-400 mb-4">Group not found</p>
        <Button onClick={() => navigate("/groups")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/groups")}
          className="bg-[#2D2D2D] hover:bg-[#3A3A3A]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{group.name}</h1>
      </div>
      
      {group.description && (
        <p className="text-gray-400">{group.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.members.map(member => (
              <div key={member.userId} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span>{member.displayName}</span>
                </div>
                {member.userId !== user?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveMember(member.userId)}
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMemberDialogOpen(true)}
              className="w-full border-[#3A3A3A] hover:bg-[#3A3A3A]"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-[#2D2D2D] border-[#3A3A3A] col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Expenses Summary</CardTitle>
              <Button onClick={() => setIsExpenseDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              Total expenses: {formatCurrency(totalExpenses)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="balances">
              <TabsList className="w-full bg-[#1A1A1A]">
                <TabsTrigger value="balances" className="flex-1">Balances</TabsTrigger>
                <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="balances" className="mt-4">
                {balances.length > 0 ? (
                  <div className="space-y-3">
                    {balances.map((balance, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-3 border border-[#3A3A3A] rounded-md hover:bg-[#3A3A3A]/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            {getMemberName(balance.userId).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{getMemberName(balance.userId)}</span>
                          <span className="mx-2 text-gray-400">owes</span>
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            {getMemberName(balance.otherUserId).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{getMemberName(balance.otherUserId)}</span>
                        </div>
                        <span className="font-medium text-lg text-green-400">{formatCurrency(balance.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[#3A3A3A] rounded-md">
                    <p className="text-gray-400">No outstanding balances</p>
                    <p className="text-xs text-gray-500 mt-1">Everyone is settled up!</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="expenses" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Active Expenses</h3>
                  {activeExpenses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Paid By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeExpenses.map(expense => (
                          <TableRow key={expense.id} className="hover:bg-[#3A3A3A]/50">
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                                  {getMemberName(expense.paidBy).charAt(0).toUpperCase()}
                                </div>
                                <span>{getMemberName(expense.paidBy)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSettleExpense(expense.id)}
                                className="h-8 w-8 text-gray-400 hover:bg-green-500/20 hover:text-green-500 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-3 text-gray-400">No active expenses</p>
                  )}

                  {settledExpenses.length > 0 && (
                    <>
                      <h3 className="text-sm font-medium text-gray-400 mt-6">Settled Expenses</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Paid By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settledExpenses.map(expense => (
                            <TableRow key={expense.id} className="opacity-60">
                              <TableCell className="font-medium">{expense.description}</TableCell>
                              <TableCell>{getMemberName(expense.paidBy)}</TableCell>
                              <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white">
          <DialogHeader>
            <DialogTitle>Add an Expense</DialogTitle>
          </DialogHeader>
          
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(onAddExpense)} className="space-y-4">
              <FormField
                control={expenseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What was this expense for?"
                        {...field}
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="paidBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Paid By</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary">
                          <SelectValue placeholder="Select who paid" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white">
                        {group.members.map(member => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExpenseDialogOpen(false)}
                  className="border-[#3A3A3A] text-gray-300 hover:bg-[#3A3A3A] hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Add Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white">
          <DialogHeader>
            <DialogTitle>Add a Member</DialogTitle>
          </DialogHeader>
          
          <Form {...memberForm}>
            <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4">
              <FormField
                control={memberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Member's name"
                        {...field}
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={memberForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="member@example.com"
                        {...field}
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMemberDialogOpen(false)}
                  className="border-[#3A3A3A] text-gray-300 hover:bg-[#3A3A3A] hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
