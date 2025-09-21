import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Phone, Send, Plus, X, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const Compose = () => {
  const [message, setMessage] = useState("")
  const [manualNumbers, setManualNumbers] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [sendingProgress, setSendingProgress] = useState(0)
  const [deliveryStats, setDeliveryStats] = useState({ delivered: 0, failed: 0, pending: 0 })
  const [loadingGroups, setLoadingGroups] = useState(true)
  const { toast } = useToast()

  const [groups, setGroups] = useState<{id: string, name: string, count: number}[]>([])
  
  // Load groups from database
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true)
        const { data, error } = await supabase
          .from('anaji_groups')
          .select('*')
          .order('name')
        
        if (error) throw error
        
        const groupsWithCount = await Promise.all(
          (data || []).map(async (group) => {
            const { count } = await supabase
              .from('anaji_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .eq('status', 'active')
            
            return {
              id: group.id,
              name: group.name,
              count: count || 0
            }
          })
        )
        
        setGroups(groupsWithCount)
      } catch (error) {
        console.error('Error loading groups:', error)
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive"
        })
      } finally {
        setLoadingGroups(false)
      }
    }
    
    loadGroups()
  }, [])

  const templates = [
    "Sunday Service Reminder: Join us for worship service this Sunday at 9:00 AM. God bless!",
    "Midweek Service: Prayer meeting tonight at 7:00 PM. Come as you are!",
    "Happy Birthday! May God's blessings be upon you on your special day.",
    "Event Reminder: Don't forget about our upcoming church event. See you there!",
    "Tithe and Offering: Remember to bring your tithes and offerings as we worship together.",
    "Prayer Request: Please join us in prayer for our community and nation.",
    "Welcome Message: Welcome to Church Of Pentecost, Anaji English Assembly! We're glad to have you."
  ]

  const addManualNumber = () => {
    const numbers = manualNumbers.split(/[,\n]/).map(n => n.trim()).filter(n => n)
    const validNumbers = numbers.filter(n => /^\+?233\d{9}$|^\+?\d{10,15}$/.test(n))
    
    if (validNumbers.length > 0) {
      setRecipients([...recipients, ...validNumbers])
      setManualNumbers("")
      toast({
        title: "Numbers Added",
        description: `${validNumbers.length} valid numbers added to recipients.`
      })
    } else if (numbers.length > 0) {
      toast({
        title: "Invalid Numbers",
        description: "Please enter valid phone numbers (e.g., +233XXXXXXXXX or 10-15 digits).",
        variant: "destructive"
      })
    } else {
      toast({
        title: "No Numbers",
        description: "Please enter phone numbers to add.",
        variant: "destructive"
      })
    }
  }

  const removeRecipient = (number: string) => {
    setRecipients(recipients.filter(r => r !== number))
  }

  const simulateDelivery = async (totalRecipients: number) => {
    setSendingStatus("sending")
    setSendingProgress(0)
    setDeliveryStats({ delivered: 0, failed: 0, pending: totalRecipients })

    // Simulate sending progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setSendingProgress(i)
      
      // Simulate delivery updates
      const delivered = Math.floor((i / 100) * totalRecipients * 0.95) // 95% success rate
      const failed = Math.floor((i / 100) * totalRecipients * 0.05) // 5% failure rate
      const pending = totalRecipients - delivered - failed
      
      setDeliveryStats({ delivered, failed, pending })
    }

    setSendingStatus("sent")
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive"
      })
      return
    }

    const totalRecipients = recipients.length + (selectedGroup ? groups.find(g => g.id === selectedGroup)?.count || 0 : 0)
    
    if (totalRecipients === 0) {
      toast({
        title: "Recipients Required",
        description: "Please select a group or add manual recipients.",
        variant: "destructive"
      })
      return
    }

    try {
      setSendingStatus("sending")
      setSendingProgress(0)
      setDeliveryStats({ delivered: 0, failed: 0, pending: totalRecipients })

      // Determine recipient info
      const recipientType = selectedGroup ? "group" : "manual"
      const recipientName = selectedGroup 
        ? groups.find(g => g.id === selectedGroup)?.name || "Unknown Group"
        : "Manual Recipients"

      // Collect all recipient phone numbers
      let allRecipients: string[] = [...recipients]
      
      // If a group is selected, get members from that group
      if (selectedGroup) {
        const { data: groupMembers, error: memberError } = await supabase
          .from('anaji_members')
          .select('phone')
          .eq('group_id', selectedGroup)
          .eq('status', 'active')
        
        if (memberError) {
          throw new Error(`Failed to fetch group members: ${memberError.message}`)
        }
        
        const groupPhones = groupMembers.map(member => member.phone).filter(phone => phone)
        allRecipients = [...allRecipients, ...groupPhones]
      }

      // Remove duplicates
      allRecipients = [...new Set(allRecipients)]

      if (allRecipients.length === 0) {
        throw new Error('No valid recipients found')
      }

      // Prepare SMS campaign data
      const campaignName = `${recipientName} - ${new Date().toLocaleDateString()}`
      
      console.log('Sending SMS campaign:', {
        campaignName,
        recipients: allRecipients,
        message: message.substring(0, 50) + '...'
      })

      // Call the edge function to send SMS
      const { data: result, error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignName,
          message,
          recipients: allRecipients,
          recipientType,
          recipientName,
          groupId: selectedGroup || null
        }
      })

      if (smsError) {
        throw new Error(`SMS service error: ${smsError.message}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send SMS')
      }

      // Update UI with real results
      setDeliveryStats({ 
        delivered: result.delivered, 
        failed: result.failed, 
        pending: 0 
      })
      setSendingProgress(100)
      setSendingStatus("sent")
      
      toast({
        title: "SMS Campaign Completed!",
        description: `${result.delivered} messages delivered, ${result.failed} failed.`
      })

      // Reset form after successful send
      setMessage("")
      setRecipients([])
      setSelectedGroup("")
      setManualNumbers("")
      
    } catch (error) {
      console.error('Error sending SMS campaign:', error)
      setSendingStatus("error")
      toast({
        title: "SMS Campaign Failed",
        description: error.message || "Failed to send SMS. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getSMSCount = (text: string) => Math.ceil(text.length / 160)
  const getTotalRecipients = () => recipients.length + (selectedGroup ? groups.find(g => g.id === selectedGroup)?.count || 0 : 0)
  const getEstimatedCost = () => (getTotalRecipients() * getSMSCount(message) * 0.05).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Compose SMS</h1>
      </div>

      {/* Sending Status */}
      {sendingStatus !== "idle" && (
        <Card className="shadow-elegant border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {sendingStatus === "sending" && <Clock className="h-5 w-5 text-primary animate-spin" />}
              {sendingStatus === "sent" && <CheckCircle className="h-5 w-5 text-success" />}
              {sendingStatus === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
              
              <div className="flex-1">
                <p className="font-medium">
                  {sendingStatus === "sending" && "Sending Messages..."}
                  {sendingStatus === "sent" && "Messages Sent Successfully!"}
                  {sendingStatus === "error" && "Failed to Send Messages"}
                </p>
                
                {sendingStatus === "sending" && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendingProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{sendingProgress}% complete</p>
                  </div>
                )}
                
                {(sendingStatus === "sent" || sendingStatus === "sending") && (
                  <div className="flex space-x-4 mt-2 text-sm">
                    <span className="text-success">✓ Delivered: {deliveryStats.delivered}</span>
                    <span className="text-destructive">✗ Failed: {deliveryStats.failed}</span>
                    <span className="text-muted-foreground">⏳ Pending: {deliveryStats.pending}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  disabled={sendingStatus === "sending"}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{message.length} characters</span>
                  <span>{getSMSCount(message)} SMS</span>
                </div>
              </div>

              {/* Cost Estimation */}
              {message && getTotalRecipients() > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipients</p>
                      <p className="font-medium">{getTotalRecipients()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SMS Count</p>
                      <p className="font-medium">{getSMSCount(message)} per recipient</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium text-primary">GH₵{getEstimatedCost()}</p>
                    </div>
                  </div>
                </div>
              )}

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
                      disabled={sendingStatus === "sending"}
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
                      disabled={sendingStatus === "sending"}
                    />
                    <Button onClick={addManualNumber} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Numbers
                    </Button>
                      disabled={sendingStatus === "sending"}
                  </div>
                </TabsContent>

                <TabsContent value="single" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      placeholder="+233 XX XXX XXXX" 
                      disabled={sendingStatus === "sending"}
                    />
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
                          disabled={sendingStatus === "sending"}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <Button 
                onClick={handleSend} 
                className="w-full" 
                size="lg"
                disabled={sendingStatus === "sending" || !message.trim() || getTotalRecipients() === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingStatus === "sending" ? "Sending..." : "Send Message"}
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
                {loadingGroups ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No groups available</p>
                  </div>
                ) : (
                groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-2 border border-border rounded-lg">
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="outline">{group.count}</Badge>
                  </div>
                ))
                )}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost Today</span>
                <span className="font-medium">GH₵12.40</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Templates
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Groups
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Import Contacts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Compose