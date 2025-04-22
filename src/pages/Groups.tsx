
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Users, Trash2 } from "lucide-react";
import { getUserGroups, createGroup, deleteGroup, Group } from "@/lib/groups";
import { toast } from "@/components/ui/use-toast";

// Form schema for group creation
const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<z.infer<typeof groupFormSchema>>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (user) {
      loadGroups();
    } else {
      // Redirect to login if not authenticated
      navigate("/login");
    }
  }, [user, navigate]);

  const loadGroups = () => {
    if (!user) return;
    
    try {
      const userGroups = getUserGroups(user.id);
      console.log("Loaded groups:", userGroups);
      setGroups(userGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        variant: "destructive",
        title: "Error loading groups",
        description: "There was a problem loading your groups. Please try again.",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof groupFormSchema>) => {
    if (!user) return;

    try {
      createGroup(values.name, values.description || "", user);
      loadGroups();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        variant: "destructive",
        title: "Error creating group",
        description: "There was a problem creating your group. Please try again.",
      });
    }
  };

  const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        deleteGroup(groupId);
        loadGroups();
      } catch (error) {
        console.error("Error deleting group:", error);
        toast({
          variant: "destructive",
          title: "Error deleting group",
          description: "There was a problem deleting the group. Please try again.",
        });
      }
    }
  };

  const filteredGroups = searchQuery
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Groups</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card 
              key={group.id} 
              className="bg-[#2D2D2D] border-[#3A3A3A] hover:border-primary/50 cursor-pointer transition-all duration-300"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold text-white">{group.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    Created {format(new Date(group.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-red-400"
                  onClick={(e) => handleDeleteGroup(group.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-gray-400 mb-3">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">{group.members.length} members</span>
                </div>
                {group.description && (
                  <p className="text-sm text-gray-300 line-clamp-2">{group.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#2D2D2D] border-[#3A3A3A]">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Groups Yet</h3>
            <p className="text-gray-400 mb-6 text-center max-w-md">
              Create a group to start sharing expenses with friends, family, or roommates.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Group
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#2D2D2D] border-[#3A3A3A] text-white">
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Group Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter group name" 
                        {...field} 
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this group is for" 
                        {...field} 
                        className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:ring-primary resize-none"
                        rows={3}
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
                  onClick={() => setIsDialogOpen(false)}
                  className="border-[#3A3A3A] text-gray-300 hover:bg-[#3A3A3A] hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Create Group
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
