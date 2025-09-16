import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Phone, Send, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Compose = () => {
  const [message, setMessage] = useState("")
  const [manualNumbers, setManualNumbers] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [recipients, setRecipients] = useState<string[]>([])
  const { toast } = useToast()

  const groups = [
    { id: "youth", name: "Youth Ministry", count: 45 },
    { id: "men", name: "Men's Fellowship", count: 32 },
    { id: "women", name: "Women's Fellowship", count: 58 },
    { id: "choir", name: "Church Choir", count: 28 },
    { id: "elders", name: "Church Elders", count: 12 },
    { id: "ushers", name: "Ushering Team", count: 20 }
  ]

  const templates = [
    "Sunday Service Reminder: Join us for worship service this Sunday at 9:00 AM. God bless!",
    "Midweek Service: Prayer meeting tonight at 7:00 PM. Come as you are!",
    "Happy Birthday! May God's blessings be upon you on your special day.",
    "Event Reminder: Don't forget about our upcoming church event. See you there!"
  ]

  const addManualNumber = () => {
    const numbers = manualNumbers.split(/[,\n]/).map(n => n.trim()).filter(n => n)
    const validNumbers = numbers.filter(n => /^\+?\d{10,15}$/.test(n))
    
    if (validNumbers.length > 0) {
      setRecipients([...recipients, ...validNumbers])
      setManualNumbers("")
      toast({
        title: "Numbers Added",
        description: `${validNumbers.length} valid numbers added to recipients.`
      })
    } else {
      toast({
        title: "Invalid Numbers",
        description: "Please enter valid phone numbers.",
        variant: "destructive"
      })
    }
  }

  const removeRecipient = (number: string) => {
    setRecipients(recipients.filter(r => r !== number))
  }

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      })
      return
    }

    if (recipients.length === 0 && !selectedGroup) {
      toast({
        title: "Recipients Required",
        description: "Please select a group or add manual recipients.",
        variant: "destructive"
      })
      return
    }

    // Simulate sending
    toast({
      title: "Message Sent!",
      description: `SMS sent successfully to ${recipients.length || 'group'} recipients.`
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Compose SMS</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Compose Area */}
        <div className="lg:col-span-2">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Message Composition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-32"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{message.length} characters</span>
                  <span>{Math.ceil(message.length / 160)} SMS</span>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setMessage(template)}
                    >
                      <span className="truncate">{template}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <Tabs defaultValue="groups" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="single">Single</TabsTrigger>
                </TabsList>

                <TabsContent value="groups" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Group</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{group.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {group.count}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Numbers</Label>
                    <Textarea
                      placeholder="Enter phone numbers separated by commas or new lines..."
                      value={manualNumbers}
                      onChange={(e) => setManualNumbers(e.target.value)}
                      className="min-h-24"
                    />
                    <Button onClick={addManualNumber} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Numbers
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="single" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+233 XX XXX XXXX" />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Added Recipients */}
              {recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Manual Recipients ({recipients.length})</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {recipients.map((number) => (
                      <Badge key={number} variant="secondary" className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {number}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeRecipient(number)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <Button onClick={handleSend} className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Groups Overview */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Available Groups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-2 border border-border rounded-lg">
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="outline">{group.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SMS Stats */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Today's Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SMS Sent</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-medium">245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">98.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Compose