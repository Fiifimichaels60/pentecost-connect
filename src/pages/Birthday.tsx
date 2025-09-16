import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Cake, Plus, Edit, Trash2, Search, Gift, Send, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Birthday {
  id: string
  name: string
  phone: string
  birthDate: string
  group: string
  autoSend: boolean
  lastSent?: string
}

const Birthday = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([
    {
      id: "1",
      name: "John Doe",
      phone: "+233 24 123 4567",
      birthDate: "1985-03-20",
      group: "Men's Fellowship",
      autoSend: true,
      lastSent: "2024-03-20"
    },
    {
      id: "2",
      name: "Mary Johnson",
      phone: "+233 54 987 6543",
      birthDate: "1990-03-25",
      group: "Women's Fellowship",
      autoSend: true
    },
    {
      id: "3",
      name: "David Wilson",
      phone: "+233 20 555 7890",
      birthDate: "1992-04-15",
      group: "Church Choir",
      autoSend: false
    },
    {
      id: "4",
      name: "Sarah Brown",
      phone: "+233 26 111 2222",
      birthDate: "1995-04-18",
      group: "Youth Ministry",
      autoSend: true
    },
    {
      id: "5",
      name: "Michael Davis",
      phone: "+233 55 333 4444",
      birthDate: "1988-03-22",
      group: "Ushering Team",
      autoSend: true
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    group: "",
    autoSend: true
  })

  const { toast } = useToast()

  const groups = [
    "Youth Ministry",
    "Men's Fellowship", 
    "Women's Fellowship",
    "Church Choir",
    "Church Elders",
    "Ushering Team"
  ]

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getUpcomingBirthdays = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return birthdays.filter(birthday => {
      const birthDate = new Date(birthday.birthDate)
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }
      
      return thisYearBirthday >= today && thisYearBirthday <= nextWeek
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
    
    return matchesSearch && matchesMonth
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.birthDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (editingBirthday) {
      // Update existing birthday
      setBirthdays(birthdays.map(birthday => 
        birthday.id === editingBirthday.id 
          ? { ...birthday, ...formData }
          : birthday
      ))
      toast({
        title: "Birthday Updated",
        description: `${formData.name}'s birthday has been updated.`
      })
    } else {
      // Create new birthday
      const newBirthday: Birthday = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        birthDate: formData.birthDate,
        group: formData.group,
        autoSend: formData.autoSend
      }
      setBirthdays([...birthdays, newBirthday])
      toast({
        title: "Birthday Added",
        description: `${formData.name}'s birthday has been added.`
      })
    }

    // Reset form
    setFormData({ name: "", phone: "", birthDate: "", group: "", autoSend: true })
    setEditingBirthday(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (birthday: Birthday) => {
    setEditingBirthday(birthday)
    setFormData({
      name: birthday.name,
      phone: birthday.phone,
      birthDate: birthday.birthDate,
      group: birthday.group,
      autoSend: birthday.autoSend
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (birthdayId: string) => {
    const birthday = birthdays.find(b => b.id === birthdayId)
    if (birthday) {
      setBirthdays(birthdays.filter(b => b.id !== birthdayId))
      toast({
        title: "Birthday Removed",
        description: `${birthday.name}'s birthday has been removed.`
      })
    }
  }

  const handleNewBirthday = () => {
    setEditingBirthday(null)
    setFormData({ name: "", phone: "", birthDate: "", group: "", autoSend: true })
    setIsDialogOpen(true)
  }

  const toggleAutoSend = (birthdayId: string) => {
    setBirthdays(birthdays.map(birthday => 
      birthday.id === birthdayId 
        ? { ...birthday, autoSend: !birthday.autoSend }
        : birthday
    ))
  }

  const sendBirthdayWish = (birthdayId: string) => {
    const birthday = birthdays.find(b => b.id === birthdayId)
    if (birthday) {
      setBirthdays(birthdays.map(b => 
        b.id === birthdayId 
          ? { ...b, lastSent: new Date().toISOString().split('T')[0] }
          : b
      ))
      toast({
        title: "Birthday Wish Sent!",
        description: `Birthday message sent to ${birthday.name}.`
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
          <DialogContent>
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
                      <SelectItem key={group} value={group}>
                        {group}
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
            {todayBirthdays.length > 0 ? (
              <div className="space-y-3">
                {todayBirthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-muted-foreground">{birthday.group}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendBirthdayWish(birthday.id)}
                      disabled={birthday.lastSent === new Date().toISOString().split('T')[0]}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {birthday.lastSent === new Date().toISOString().split('T')[0] ? "Sent" : "Send"}
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

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Upcoming Birthdays (Next 7 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBirthdays.map((birthday) => {
                const birthDate = new Date(birthday.birthDate)
                const thisYear = new Date().getFullYear()
                const thisYearBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
                const age = thisYear - birthDate.getFullYear()
                
                return (
                  <div key={birthday.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{birthday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {thisYearBirthday.toLocaleDateString()} • Turning {age}
                      </p>
                      <p className="text-xs text-muted-foreground">{birthday.group}</p>
                    </div>
                    <Badge variant={birthday.autoSend ? "default" : "secondary"}>
                      {birthday.autoSend ? "Auto" : "Manual"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Name</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Auto Send</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBirthdays.map((birthday) => {
                const birthDate = new Date(birthday.birthDate)
                const age = new Date().getFullYear() - birthDate.getFullYear()
                
                return (
                  <TableRow key={birthday.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{birthday.name}</p>
                        <p className="text-sm text-muted-foreground">{birthday.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{birthDate.toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">Age: {age}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{birthday.group || "No Group"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={birthday.autoSend}
                        onCheckedChange={() => toggleAutoSend(birthday.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {birthday.lastSent ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(birthday.lastSent).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => sendBirthdayWish(birthday.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
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
          
          {filteredBirthdays.length === 0 && (
            <div className="text-center py-12">
              <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Birthdays Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedMonth !== "all" 
                  ? "Try adjusting your filters" 
                  : "Get started by adding birthday information for your members"
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
    </div>
  )
}

export default Birthday