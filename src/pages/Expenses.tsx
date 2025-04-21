
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  getExpenses,
  getCategories,
  addExpense,
  updateExpense,
  deleteExpense,
  formatCurrency,
  Expense,
  Category,
} from "@/lib/expenses";
import { Plus, Pencil, Trash2 } from "lucide-react";

// Form schema for expense form
const expenseFormSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().min(1, "Description is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  categoryId: z.string({ required_error: "Please select a category" }),
});

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      categoryId: "",
    },
  });

  // Load expenses and categories
  useEffect(() => {
    if (user) {
      setExpenses(getExpenses(user.id));
      setCategories(getCategories(user.id));
    }
  }, [user]);

  // Set form values when editing
  useEffect(() => {
    if (editingExpense) {
      form.reset({
        amount: editingExpense.amount.toString(),
        description: editingExpense.description,
        date: format(new Date(editingExpense.date), "yyyy-MM-dd"),
        categoryId: editingExpense.categoryId,
      });
    } else {
      form.reset({
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        categoryId: "",
      });
    }
  }, [editingExpense, form]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof expenseFormSchema>) => {
    if (!user) return;

    try {
      const expenseData = {
        amount: parseFloat(values.amount),
        description: values.description,
        date: new Date(values.date).toISOString(),
        categoryId: values.categoryId,
        userId: user.id,
      };

      if (editingExpense) {
        // Update existing expense
        const updated = updateExpense({
          ...expenseData,
          id: editingExpense.id,
          createdAt: editingExpense.createdAt,
          updatedAt: new Date().toISOString(),
        });
        setExpenses(getExpenses(user.id));
      } else {
        // Add new expense
        addExpense(expenseData);
        setExpenses(getExpenses(user.id));
      }

      closeDialog();
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  // Handle expense deletion
  const handleDelete = (expenseId: string) => {
    if (!user) return;
    
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(expenseId, user.id);
      setExpenses(getExpenses(user.id));
    }
  };

  // Open dialog for adding or editing
  const openDialog = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{getCategoryName(expense.categoryId)}</TableCell>
                      <TableCell>{format(new Date(expense.date), "MM/dd/yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No expenses found. Click "Add Expense" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Grocery shopping" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExpense ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
