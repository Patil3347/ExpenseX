
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
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
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { 
  Category,
  getCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from "@/lib/expenses";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required").regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code",
  }),
});

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      color: "#9b87f5",
    },
  });

  useEffect(() => {
    if (user) {
      setCategories(getCategories(user.id));
    }
  }, [user]);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        color: editingCategory.color,
      });
    } else {
      form.reset({
        name: "",
        color: "#9b87f5",
      });
    }
  }, [editingCategory, form]);

  const onSubmit = (values: z.infer<typeof categoryFormSchema>) => {
    if (!user) return;

    try {
      const categoryData = {
        name: values.name,
        color: values.color,
        userId: user.id,
      };

      if (editingCategory) {
        updateCategory({
          ...categoryData,
          id: editingCategory.id,
          icon: editingCategory.icon,
        });
      } else {
        addCategory(categoryData);
      }

      setCategories(getCategories(user.id));
      closeDialog();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = (categoryId: string) => {
    if (!user) return;

    try {
      deleteCategory(categoryId, user.id);
      setCategories(getCategories(user.id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const openDialog = (category?: Category) => {
    setEditingCategory(category || null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden bg-[#2D2D2D] border-[#3A3A3A] transition-all duration-200 hover:border-primary/50">
            <CardHeader className="p-4 pb-2" style={{ backgroundColor: category.color, color: "#fff" }}>
              <CardTitle className="flex justify-between items-center">
                <span>{category.name}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => openDialog(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 bg-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-sm text-muted-foreground">{category.color}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No categories found</p>
            <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add your first category
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#2D2D2D] border-[#3A3A3A]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Food & Dining" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" {...field} className="w-14 h-10 p-1" />
                      </FormControl>
                      <Input 
                        {...field}
                        placeholder="#9b87f5"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
