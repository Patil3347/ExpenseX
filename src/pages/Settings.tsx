
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  // App preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const handleSavePreferences = () => {
    // In a real app, these would be saved to a backend
    localStorage.setItem("settings-notifications", JSON.stringify(notificationsEnabled));
    localStorage.setItem("settings-darkMode", JSON.stringify(darkMode));
    localStorage.setItem("settings-currency", currency);
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme for the application
              </p>
            </div>
            <Switch 
              id="dark-mode" 
              checked={darkMode} 
              onCheckedChange={setDarkMode} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for expense reminders and summaries
              </p>
            </div>
            <Switch 
              id="notifications" 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={currency} onValueChange={setCurrency}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="USD" id="usd" />
              <Label htmlFor="usd">USD - United States Dollar ($)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="EUR" id="eur" />
              <Label htmlFor="eur">EUR - Euro (€)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="GBP" id="gbp" />
              <Label htmlFor="gbp">GBP - British Pound (£)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="JPY" id="jpy" />
              <Label htmlFor="jpy">JPY - Japanese Yen (¥)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences}>Save Settings</Button>
      </div>
    </div>
  );
}
