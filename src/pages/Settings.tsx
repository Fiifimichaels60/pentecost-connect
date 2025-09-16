import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings as SettingsIcon, Moon, Sun, Key, Save, Eye, EyeOff } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/hooks/use-toast"

const Settings = () => {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  
  const [apiSettings, setApiSettings] = useState({
    clientId: "",
    clientSecret: "",
    senderId: ""
  })
  
  const [showSecrets, setShowSecrets] = useState({
    clientSecret: false
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsDeliveryReports: true,
    dailyReports: false,
    errorAlerts: true
  })

  const handleApiSave = () => {
    if (!apiSettings.clientId || !apiSettings.clientSecret || !apiSettings.senderId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all API configuration fields.",
        variant: "destructive"
      })
      return
    }

    // In a real app, this would be saved securely
    toast({
      title: "Settings Saved",
      description: "Hubtel SMS API configuration has been saved successfully."
    })
  }

  const handleNotificationSave = () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated."
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Hubtel SMS API Configuration</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your Hubtel SMS API credentials to enable SMS sending functionality.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="Enter your Hubtel Client ID"
                  value={apiSettings.clientId}
                  onChange={(e) => setApiSettings({...apiSettings, clientId: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    type={showSecrets.clientSecret ? "text" : "password"}
                    placeholder="Enter your Hubtel Client Secret"
                    value={apiSettings.clientSecret}
                    onChange={(e) => setApiSettings({...apiSettings, clientSecret: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecrets({...showSecrets, clientSecret: !showSecrets.clientSecret})}
                  >
                    {showSecrets.clientSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  placeholder="Enter your SMS Sender ID"
                  value={apiSettings.senderId}
                  onChange={(e) => setApiSettings({...apiSettings, senderId: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  This is the name or number that will appear as the sender of your SMS messages.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">API Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Get your API credentials from the Hubtel developer portal</p>
                  <p>• Ensure your account has sufficient SMS credits</p>
                  <p>• The Sender ID must be approved by Hubtel before use</p>
                </div>
              </div>

              <Button onClick={handleApiSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save API Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize the appearance of your application.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex items-center space-x-2"
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex items-center space-x-2"
                  >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="flex items-center space-x-2"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>System</span>
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Theme Preview</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded" />
                    <span className="text-sm">Primary Color</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-secondary-gold rounded" />
                    <span className="text-sm">Accent Color</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-background border border-border rounded" />
                    <span className="text-sm">Background</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how you want to receive notifications and reports.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, emailNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Delivery Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when SMS messages are delivered
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsDeliveryReports}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, smsDeliveryReports: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily summary reports via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReports}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, dailyReports: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Error Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get immediate alerts for system errors
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.errorAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, errorAlerts: checked})
                    }
                  />
                </div>
              </div>

              <Button onClick={handleNotificationSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings