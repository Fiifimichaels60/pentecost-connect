import { useState, useEffect } from "react"
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
import { supabase } from "@/integrations/supabase/client"

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
  is_admin: boolean
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)

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

  // Load members and categories from database
  useEffect(() => {
    loadMembers()
    loadCategories()
  }, [])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_members')
        .select(`
          *,
          anaji_groups(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedMembers = (data || []).map(member => ({
        id: member.id,
        first_name: member.name.split(' ')[0] || member.name,
        last_name: member.name.split(' ').slice(1).join(' ') || '',
        email: member.email || 'N/A',
        phone: member.phone,
        created_at: member.created_at,
        is_admin: false
      }))

      setMembers(formattedMembers)
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (member.phone && member.phone.includes(searchTerm)) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    // For now, ignore group filtering since we don't have group relationships
    return matchesSearch
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name and email.",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingMember) {
        // Update existing member
        const [firstName, ...lastNameParts] = formData.name.split(' ')
        const { error } = await supabase
          .from('nana_profiles')
          .update({
            first_name: firstName,
            last_name: lastNameParts.join(' '),
            email: formData.email,
            phone: formData.phone || null,
          })
          .eq('id', editingMember.id)

        if (error) throw error

        toast({
          title: "Member Updated",
          description: `${formData.name} has been updated successfully.`
        })
      } else {
        // For new members, they need to sign up through auth
        toast({
          title: "Note",
          description: "New members need to sign up through the authentication system.",
          variant: "default"
        })
      }

      // Reload members
      await loadMembers()
      
      // Reset form
      setFormData({ name: "", phone: "", email: "", group: "" })
      setEditingMember(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving member:', error)
      toast({
        title: "Error",
        description: "Failed to save member",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: `${member.first_name} ${member.last_name}`,
      phone: member.phone || '',
      email: member.email,
      group: ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      try {
        const { error } = await supabase
          .from('nana_profiles')
          .delete()
          .eq('id', memberId)

        if (error) throw error

        toast({
          title: "Member Removed",
          description: `${member.first_name} ${member.last_name} has been removed.`
        })
        
        await loadMembers()
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

  const toggleStatus = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      try {
        const { error } = await supabase
          .from('nana_profiles')
          .update({ is_admin: !member.is_admin })
          .eq('id', memberId)

        if (error) throw error
        
        await loadMembers()
        toast({
          title: "Status Updated",
          description: "Member status has been updated."
        })
      } catch (error) {
        console.error('Error updating member status:', error)
        toast({
          title: "Error",
          description: "Failed to update member status",
          variant: "destructive"
        })
      }
    }
  }

  const handleNewMember = () => {
    setEditingMember(null)
    setFormData({ name: "", phone: "", email: "", group: "" })
    setIsDialogOpen(true)
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
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
              {members.length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
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
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {member.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>General</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.is_admin ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(member.id)}
                    >
                      {member.is_admin ? "admin" : "member"}
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