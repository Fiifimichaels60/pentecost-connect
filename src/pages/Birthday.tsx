import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Cake, Plus, CreditCard as Edit, Trash2, Search, Gift, Send, Calendar, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Birthday {
  id: string
  name: string
  phone: string
  email?: string
  birthDate: string
  location?: string
  group: string
  autoSend: boolean
  lastSent?: string
}

const Birthday = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null)
  const [isSendWishDialog, setIsSendWishDialog] = useState(false)
  const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null)
  const [wishMessage, setWishMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    location: "",
    group: "",
    autoSend: true
  })

  const { toast } = useToast()

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  useEffect(() => {
    loadBirthdaysAndGroups()
  }, [])

  const loadBirthdaysAndGroups = async () => {
    try {
      // Load members with birthdays from anaji_members
      const { data: membersData, error: membersError } = await supabase
        .from('anaji_members')
        .select('*')
        .not('date_of_birth', 'is', null)
        .order('date_of_birth')

      if (membersError) throw membersError

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('anaji_groups')
        .select('id, name')
        .order('name')

      if (groupsError) throw groupsError

      // For each member, fetch their groups
      const formattedBirthdays = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: memberGroups } = await supabase
            .from('anaji_member_groups')
            .select(`
              anaji_groups (
                name
              )
            `)
            .eq('member_id', member.id)
            .limit(1)

          const groupName = memberGroups && memberGroups.length > 0
            ? (memberGroups[0].anaji_groups as any)?.name
            : 'No Group'

          return {
            id: member.id,
            name: member.name,
            phone: member.phone,
            email: member.email,
            birthDate: member.date_of_birth,
            location: member.location,
            group: groupName,
            autoSend: true,
            lastSent: undefined
          }
        })
      )

      setBirthdays(formattedBirthdays)
      setGroups(groupsData || [])
    } catch (error) {
      console.error('Error loading birthdays:', error)
      toast({
        title: "Error",
        description: "Failed to load birthday data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getUpcomingBirthdays = () => {
    const today = new Date()
    const next14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    
    return birthdays.filter(birthday => {
      const birthDate = new Date(birthday.birthDate)
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }
      
      return thisYearBirthday >= today && thisYearBirthday <= next14Days
    })
  }

  const getTodayBirthdays = () => {
    const today = new Date()
    return birthdays.filter(birthday => {
      const birthDate = new Date(birthday.birthDate)
      return birthDate.getMonth() === today.getMonth() && 
             birthDate.getDate() === today.getDate()
    })
  }

  const filteredBirthdays = birthdays.filter(birthday => {
    const matchesSearch = birthday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         birthday.phone.includes(searchTerm)
    
    let matchesMonth = true
    if (selectedMonth !== "all") {
      const birthDate = new Date(birthday.birthDate)
      matchesMonth = birthDate.getMonth() === months.indexOf(selectedMonth)
    }
    
    // Only show birthdays within 14 days
    const today = new Date()
    const next14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    const birthDate = new Date(birthday.birthDate)
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    const within14Days = thisYearBirthday >= today && thisYearBirthday <= next14Days
    
    return matchesSearch && matchesMonth && within14Days
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.birthDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingBirthday) {
        // Update existing member's birthday info
        const { error } = await supabase
          .from('anaji_members')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            date_of_birth: formData.birthDate,
            location: formData.location || null,
            group_id: formData.group || null
          })
          .eq('id', editingBirthday.id)

        if (error) throw error

        toast({
          title: "Birthday Updated",
          description: `${formData.name}'s birthday has been updated.`
        })
      } else {
        // Create new member with birthday
        const { error } = await supabase
          .from('anaji_members')
          .insert({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            date_of_birth: formData.birthDate,
            location: formData.location || null,
            group_id: formData.group || null
          })

        if (error) throw error

        toast({
          title: "Birthday Added",
          description: `${formData.name}'s birthday has been added.`
        })
      }

      // Reload data
      await loadBirthdaysAndGroups()
      
      // Reset form
      setFormData({ name: "", phone: "", email: "", birthDate: "", location: "", group: "", autoSend: true })
      setEditingBirthday(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving birthday:', error)
      toast({
        title: "Error",
        description: "Failed to save birthday",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (birthday: Birthday) => {
    setEditingBirthday(birthday)
    setFormData({
      name: birthday.name,
      phone: birthday.phone,
      email: birthday.email || "",
      birthDate: birthday.birthDate,
      location: birthday.location || "",
      group: "",
      autoSend: birthday.autoSend
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (birthdayId: string) => {
    const birthday = birthdays.find(b => b.id === birthdayId)
    if (birthday) {
      try {
        const { error } = await supabase
          .from('anaji_members')
          .delete()
          .eq('id', birthdayId)

        if (error) throw error

        toast({
          title: "Member Removed",
          description: `${birthday.name} has been removed.`
        })
        
        await loadBirthdaysAndGroups()
      } catch (error) {
        console.error('Error deleting member:', error)
        toast({
          title: "Error",
          description: "Failed to delete member",
          variant: "destructive"
        })
      }
    }
  }

  const handleNewBirthday = () => {
    setEditingBirthday(null)
    setFormData({ name: "", phone: "", email: "", birthDate: "", location: "", group: "", autoSend: true })
    setIsDialogOpen(true)
  }

  const generateBirthdayMessage = (name: string) => {
    return `🎉 Happy Birthday ${name}! 🎂\n\nWishing you a day filled with joy, love, and blessings. May this new year of your life bring you abundant happiness, good health, and success in all your endeavors.\n\nCelebrate and enjoy your special day!\n\nWith love and prayers,\nYour Church Family`
  }

  const openSendWishDialog = (birthdayId: string) => {
    const birthday = birthdays.find(b => b.id === birthdayId)
    if (birthday) {
      setSelectedBirthday(birthday)
      setWishMessage(generateBirthdayMessage(birthday.name))
      setIsSendWishDialog(true)
    }
  }

  const sendBirthdayWish = async () => {
    if (!selectedBirthday || !wishMessage.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      })
      return
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName: `Birthday Wish - ${selectedBirthday.name}`,
          message: wishMessage,
          recipients: [selectedBirthday.phone],
          recipientType: 'single',
          recipientName: selectedBirthday.name
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Birthday Wish Sent!",
          description: `Message sent to ${selectedBirthday.name} at ${selectedBirthday.phone}.`
        })
        setIsSendWishDialog(false)
        setSelectedBirthday(null)
        setWishMessage("")
      } else {
        throw new Error(result.error || 'Failed to send SMS')
      }
    } catch (error) {
      console.error('Error sending birthday wish:', error)
      toast({
        title: "Error",
        description: "Failed to send birthday wish. Please check your SMS settings.",
        variant: "destructive"
      })
    }
  }

  const upcomingBirthdays = getUpcomingBirthdays()
  const todayBirthdays = getTodayBirthdays()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cake className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Birthday Management</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewBirthday}>
              <Plus className="h-4 w-4 mr-2" />
              Add Birthday
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBirthday ? "Edit Birthday" : "Add New Birthday"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter location/address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select 
                  value={formData.group} 
                  onValueChange={(value) => setFormData({...formData, group: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSend"
                  checked={formData.autoSend}
                  onCheckedChange={(checked) => setFormData({...formData, autoSend: checked})}
                />
                <Label htmlFor="autoSend">Auto-send birthday wishes</Label>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingBirthday ? "Update Birthday" : "Add Birthday"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert for Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card className="shadow-elegant border-l-4 border-l-secondary-gold bg-secondary-gold/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-secondary-gold">
              <Gift className="h-5 w-5" />
              <span>🎉 Upcoming Birthdays Alert!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              {upcomingBirthdays.length} member{upcomingBirthdays.length > 1 ? 's' : ''} {upcomingBirthdays.length > 1 ? 'have' : 'has'} birthdays in the next 14 days:
            </p>
            <div className="space-y-2">
              {upcomingBirthdays.map((birthday) => {
                const birthDate = new Date(birthday.birthDate)
                const thisYear = new Date().getFullYear()
                const thisYearBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
                const age = thisYear - birthDate.getFullYear()
                const today = new Date()
                const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={birthday.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} • Turning {age} • {birthday.group}
                      </p>
                      {birthday.location && (
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {birthday.location}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openSendWishDialog(birthday.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send Wish
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats and Today's Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Birthdays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{birthdays.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-gold">{upcomingBirthdays.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-secondary-gold" />
              <span>Today's Birthdays</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : todayBirthdays.length > 0 ? (
              <div className="space-y-3">
                {todayBirthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-muted-foreground">{birthday.group}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openSendWishDialog(birthday.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No birthdays today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search birthdays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Birthdays Table */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading birthdays...
                  </TableCell>
                </TableRow>
              ) : filteredBirthdays.map((birthday) => {
                const birthDate = new Date(birthday.birthDate)
                const age = new Date().getFullYear() - birthDate.getFullYear()
                
                return (
                  <TableRow key={birthday.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{birthday.name}</p>
                        {birthday.location && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {birthday.location}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{birthDate.toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">Age: {age}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{birthday.phone}</p>
                        {birthday.email && (
                          <p className="text-xs text-muted-foreground">{birthday.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{birthday.group}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(birthday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(birthday.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {filteredBirthdays.length === 0 && !loading && (
            <div className="text-center py-12">
              <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Birthdays Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedMonth !== "all" 
                  ? "Try adjusting your filters" 
                  : "Get started by adding birthdays for your members"
                }
              </p>
              {!searchTerm && selectedMonth === "all" && (
                <Button onClick={handleNewBirthday}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Birthday
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Birthday Wish Dialog */}
      <Dialog open={isSendWishDialog} onOpenChange={setIsSendWishDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Birthday Wish to {selectedBirthday?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input value={selectedBirthday?.phone || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wishMessage">Birthday Message</Label>
              <Textarea
                id="wishMessage"
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                placeholder="Enter your birthday wish..."
                rows={8}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {wishMessage.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendWishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendBirthdayWish} disabled={!wishMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Wish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Birthday