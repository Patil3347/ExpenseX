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
      // Calculate equal split amount for all members (including payer)
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
    <div className="space-y-8">
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
        <p className="text-gray-300 text-lg">{group.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-[#2D2D2D] border-[#3A3A3A] col-span-1 shadow-lg transform transition-transform hover:scale-102">
          <CardHeader className="pb-3 border-b border-[#3A3A3A]">
            <CardTitle className="text-xl font-bold">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {group.members.map((member, idx) => {
              const bgColors = [
                "bg-gradient-to-br from-[#8B5CF6] to-[#1EAEDB]",
                "bg-gradient-to-br from-[#D946EF] to-[#F97316]",
                "bg-gradient-to-br from-[#6E59A5] to-[#4E67EB]",
                "bg-gradient-to-br from-[#FFC107] to-[#4CAF50]",
                "bg-gradient-to-br from-[#2196F3] to-[#6E59A5]",
                "bg-gradient-to-br from-[#1EAEDB] to-[#FF6B6B]",
                "bg-gradient-to-br from-[#8A2BE2] to-[#9b87f5]",
              ];
              const chosenBg = bgColors[idx % bgColors.length];
              return (
                <div key={member.userId} className="flex justify-between items-center p-3 hover:bg-[#3A3A3A]/50 rounded-md transition-colors">
                  <div className="flex items-center">
                    <div className={`h-12 w-12 rounded-full ${chosenBg} flex items-center justify-center mr-3 text-xl font-extrabold text-white shadow-lg`}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="px-3 py-1 rounded-md font-bold text-lg"
                      style={{
                        color: "#FFFFFF",
                        background: "linear-gradient(90deg, rgba(38,38,49,0.93),rgba(144,97,241,0.71))",
                        boxShadow: "0 1px 8px 0 rgba(0,0,0,0.14)"
                      }}
                    >
                      {member.displayName}
                    </span>
                  </div>
                  {member.userId !== user?.id && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="h-9 w-9 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <UserMinus className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="pt-3 border-t border-[#3A3A3A]">
            <Button 
              variant="outline" 
              onClick={() => setIsMemberDialogOpen(true)}
              className="w-full border-[#3A3A3A] hover:bg-[#3A3A3A] text-lg py-5"
            >
              <UserPlus className="mr-2 h-5 w-5" /> Add Member
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-[#2D2D2D] border-[#3A3A3A] col-span-1 md:col-span-2 shadow-lg transform transition-transform hover:scale-102">
          <CardHeader className="pb-3 border-b border-[#3A3A3A]">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Expenses Summary</CardTitle>
                <CardDescription className="text-gray-300 text-base mt-1">
                  Total expenses: {formatCurrency(totalExpenses)}
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsExpenseDialogOpen(true)} 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" /> Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="balances" className="w-full">
              <TabsList className="w-full bg-[#1A1A1A] mb-4">
                <TabsTrigger value="balances" className="flex-1 text-lg py-3">Balances</TabsTrigger>
                <TabsTrigger value="expenses" className="flex-1 text-lg py-3">Expenses</TabsTrigger>
              </TabsList>
              <TabsContent value="balances">
                {balances.length > 0 ? (
                  <div className="space-y-4">
                    {balances.map((balance, index) => {
                      const userIdx = group.members.findIndex(m => m.userId === balance.userId);
                      const otherIdx = group.members.findIndex(m => m.userId === balance.otherUserId);
                      const userBg = [
                        "bg-gradient-to-br from-[#8B5CF6] to-[#1EAEDB]",
                        "bg-gradient-to-br from-[#D946EF] to-[#F97316]",
                        "bg-gradient-to-br from-[#6E59A5] to-[#4E67EB]",
                        "bg-gradient-to-br from-[#FFC107] to-[#4CAF50]",
                        "bg-gradient-to-br from-[#2196F3] to-[#6E59A5]",
                        "bg-gradient-to-br from-[#1EAEDB] to-[#FF6B6B]",
                        "bg-gradient-to-br from-[#8A2BE2] to-[#9b87f5]",
                      ][userIdx % 7];
                      const otherBg = [
                        "bg-gradient-to-br from-[#8B5CF6] to-[#1EAEDB]",
                        "bg-gradient-to-br from-[#D946EF] to-[#F97316]",
                        "bg-gradient-to-br from-[#6E59A5] to-[#4E67EB]",
                        "bg-gradient-to-br from-[#FFC107] to-[#4CAF50]",
                        "bg-gradient-to-br from-[#2196F3] to-[#6E59A5]",
                        "bg-gradient-to-br from-[#1EAEDB] to-[#FF6B6B]",
                        "bg-gradient-to-br from-[#8A2BE2] to-[#9b87f5]",
                      ][otherIdx % 7];
                      return (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-4 border border-[#3A3A3A] rounded-md hover:bg-[#3A3A3A]/50 transition-colors shadow-md"
                      >
                        <div className="flex items-center">
                          <div className={`h-12 w-12 rounded-full ${userBg} flex items-center justify-center mr-3 text-xl font-extrabold text-white shadow-lg`}>
                            {getMemberName(balance.userId).charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="px-3 py-1 rounded-md font-bold text-lg"
                            style={{
                              color: "#FFFFFF",
                              background: "linear-gradient(90deg, rgba(36,19,65,0.86),rgba(38,38,49,0.93),rgba(144,97,241,0.41))",
                              boxShadow: "0 1px 8px 0 rgba(0,0,0,0.09)"
                            }}
                          >
                            {getMemberName(balance.userId)}
                          </span>
                          <span className="mx-3 text-gray-200 text-lg font-semibold drop-shadow">owes</span>
                          <div className={`h-12 w-12 rounded-full ${otherBg} flex items-center justify-center mr-3 text-xl font-extrabold text-white shadow-lg`}>
                            {getMemberName(balance.otherUserId).charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="px-3 py-1 rounded-md font-bold text-lg"
                            style={{
                              color: "#FFFFFF",
                              background: "linear-gradient(90deg, rgba(38,38,49,0.93),rgba(144,97,241,0.71))",
                              boxShadow: "0 1px 8px 0 rgba(0,0,0,0.14)"
                            }}
                          >
                            {getMemberName(balance.otherUserId)}
                          </span>
                        </div>
                        <span className="font-extrabold text-xl text-green-400 drop-shadow-sm bg-black/10 px-5 py-2 rounded-lg border border-green-500/20">{formatCurrency(balance.amount)}</span>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-[#3A3A3A] rounded-md">
                    <p className="text-gray-300 text-xl font-medium">No outstanding balances</p>
                    <p className="text-gray-400 mt-2">Everyone is settled up!</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="expenses">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-200">Active Expenses</h3>
                  {activeExpenses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#3A3A3A] hover:bg-transparent">
                          <TableHead className="text-gray-300 text-base">Description</TableHead>
                          <TableHead className="text-gray-300 text-base">Paid By</TableHead>
                          <TableHead className="text-gray-300 text-base">Date</TableHead>
                          <TableHead className="text-gray-300 text-base text-right">Amount</TableHead>
                          <TableHead className="text-gray-300 text-base w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeExpenses.map(expense => {
                          const payerIdx = group.members.findIndex(m => m.userId === expense.paidBy);
                          const payerBg = [
                            "bg-gradient-to-br from-[#8B5CF6] to-[#1EAEDB]",
                            "bg-gradient-to-br from-[#D946EF] to-[#F97316]",
                            "bg-gradient-to-br from-[#6E59A5] to-[#4E67EB]",
                            "bg-gradient-to-br from-[#FFC107] to-[#4CAF50]",
                            "bg-gradient-to-br from-[#2196F3] to-[#6E59A5]",
                            "bg-gradient-to-br from-[#1EAEDB] to-[#FF6B6B]",
                            "bg-gradient-to-br from-[#8A2BE2] to-[#9b87f5]",
                          ][payerIdx % 7];
                          return (
                          <TableRow key={expense.id} className="border-[#3A3A3A] hover:bg-[#3A3A3A]/50">
                            <TableCell className="font-medium text-base">{expense.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-10 w-10 rounded-full ${payerBg} flex items-center justify-center mr-3 font-bold shadow-md text-white text-lg`}>
                                  {getMemberName(expense.paidBy).charAt(0).toUpperCase()}
                                </div>
                                <span
                                  className="px-2 py-0.5 rounded-md font-semibold text-base"
                                  style={{
                                    color: "#FFFFFF",
                                    background: "#563B99",
                                    boxShadow: "0 1px 4px 0 rgba(44,20,92,0.10)"
                                  }}
                                >
                                  {getMemberName(expense.paidBy)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-base">{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="text-right font-bold text-lg text-white">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSettleExpense(expense.id)}
                                className="h-10 w-10 text-gray-400 hover:bg-green-500/20 hover:text-green-500 transition-colors"
                              >
                                <Check className="h-6 w-6" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-6 text-gray-400 border border-dashed border-[#3A3A3A] rounded-md text-lg">No active expenses</p>
                  )}

                  {settledExpenses.length > 0 && (
                    <>
                      <h3 className="text-xl font-bold text-gray-200 mt-8">Settled Expenses</h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#3A3A3A] hover:bg-transparent">
                            <TableHead className="text-gray-300 text-base">Description</TableHead>
                            <TableHead className="text-gray-300 text-base">Paid By</TableHead>
                            <TableHead className="text-gray-300 text-base">Date</TableHead>
                            <TableHead className="text-gray-300 text-base text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settledExpenses.map(expense => {
                            const payerIdx = group.members.findIndex(m => m.userId === expense.paidBy);
                            const payerBg = [
                              "bg-gradient-to-br from-[#8B5CF6] to-[#1EAEDB]",
                              "bg-gradient-to-br from-[#D946EF] to-[#F97316]",
                              "bg-gradient-to-br from-[#6E59A5] to-[#4E67EB]",
                              "bg-gradient-to-br from-[#FFC107] to-[#4CAF50]",
                              "bg-gradient-to-br from-[#2196F3] to-[#6E59A5]",
                              "bg-gradient-to-br from-[#1EAEDB] to-[#FF6B6B]",
                              "bg-gradient-to-br from-[#8A2BE2] to-[#9b87f5]",
                            ][payerIdx % 7];
                            return (
                            <TableRow key={expense.id} className="border-[#3A3A3A] opacity-60 hover:bg-[#3A3A3A]/30">
                              <TableCell className="font-medium text-base">{expense.description}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className={`h-10 w-10 rounded-full ${payerBg} flex items-center justify-center mr-3 shadow-sm text-white text-lg font-bold`}>
                                    {getMemberName(expense.paidBy).charAt(0).toUpperCase()}
                                  </div>
                                  <span
                                    className="px-2 py-0.5 rounded-md font-semibold text-base"
                                    style={{
                                      color: "#FFFFFF",
                                      background: "#563B99",
                                      boxShadow: "0 1px 4px 0 rgba(44,20,92,0.07)"
                                    }}
                                  >
                                    {getMemberName(expense.paidBy)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right font-medium text-base">{formatCurrency(expense.amount)}</TableCell>
                            </TableRow>
                          )})}
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
