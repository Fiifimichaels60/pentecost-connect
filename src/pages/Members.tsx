import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Plus, Edit, Trash2, Search, Phone, Mail, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Member {
  id: string
  name: string
  phone: string
  email: string
  group: string
  dateJoined: string
  status: "active" | "inactive"
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "John Doe",
      phone: "+233 24 123 4567",
      email: "john.doe@email.com",
      group: "Men's Fellowship",
      dateJoined: "2024-01-15",
      status: "active"
    },
    {
      id: "2",
      name: "Mary Johnson",
      phone: "+233 54 987 6543",
      email: "mary.johnson@email.com",
      group: "Women's Fellowship",
      dateJoined: "2024-02-01",
      status: "active"
    },
    {
      id: "3",
      name: "David Wilson",
      phone: "+233 20 555 7890",
      email: "david.wilson@email.com",
      group: "Church Choir",
      dateJoined: "2024-01-20",
      status: "active"
    },
    {
      id: "4",
      name: "Sarah Brown",
      phone: "+233 26 111 2222",
      email: "sarah.brown@email.com",
      group: "Youth Ministry",
      dateJoined: "2024-02-10",
      status: "inactive"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    group: ""
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

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = selectedGroup === "all" || member.group === selectedGroup
    return matchesSearch && matchesGroup
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name and phone number.",
        variant: "destructive"
      })
      return
    }

    if (editingMember) {
      // Update existing member
      setMembers(members.map(member => 
        member.id === editingMember.id 
          ? { ...member, ...formData, status: "active" as const }
          : member
      ))
      toast({
        title: "Member Updated",
        description: `${formData.name} has been updated successfully.`
      })
    } else {
      // Create new member
      const newMember: Member = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        group: formData.group,
        dateJoined: new Date().toISOString().split('T')[0],
        status: "active"
      }
      setMembers([...members, newMember])
      toast({
        title: "Member Added",
        description: `${formData.name} has been added successfully.`
      })
    }

    // Reset form
    setFormData({ name: "", phone: "", email: "", group: "" })
    setEditingMember(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      group: member.group
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      setMembers(members.filter(m => m.id !== memberId))
      toast({
        title: "Member Removed",
        description: `${member.name} has been removed.`
      })
    }
  }

  const handleNewMember = () => {
    setEditingMember(null)
    setFormData({ name: "", phone: "", email: "", group: "" })
    setIsDialogOpen(true)
  }

  const toggleStatus = (memberId: string) => {
    setMembers(members.map(member => 
      member.id === memberId 
        ? { ...member, status: member.status === "active" ? "inactive" : "active" }
        : member
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Members Management</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewMember}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Member" : "Add New Member"}
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
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
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMember ? "Update Member" : "Add Member"}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {members.filter(m => m.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{member.phone}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{member.group || "No Group"}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.dateJoined).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(member.id)}
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Members Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedGroup !== "all" 
                  ? "Try adjusting your filters" 
                  : "Get started by adding your first member"
                }
              </p>
              {!searchTerm && selectedGroup === "all" && (
                <Button onClick={handleNewMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Members