
import { useState, useEffect } from "react";
import { useAuth, User } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;

    try {
      // Get all users
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: any) => u.id === user.id);

      if (userIndex !== -1) {
        // Update user
        const updatedUser = {
          ...users[userIndex],
          name,
          email,
        };

        users[userIndex] = updatedUser;
        localStorage.setItem("users", JSON.stringify(users));

        // Update current user session
        const { password: _, ...userWithoutPassword } = updatedUser;
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });

        // Refresh page to update user object in context
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: "There was an error updating your profile",
      });
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
