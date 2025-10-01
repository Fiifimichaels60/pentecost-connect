import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Plus, Edit, Trash2, Search, Phone, Mail, Users, CalendarIcon, MapPin, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Member {
  id: string
  name: string
  email: string
  phone: string
  group_id: string | null
  group_name: string | null
  location: string | null
  date_of_birth: string | null
  status: string
  image_url: string | null
  created_at: string
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    group: "",
    location: "",
    day: "",
    month: "",
    year: "",
    imageUrl: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { toast } = useToast()

  // Load members and categories from database
  useEffect(() => {
    loadMembers()
    loadGroups()
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
        name: member.name,
        email: member.email || 'N/A',
        phone: member.phone,
        group_id: member.group_id,
        group_name: (member as any).anaji_groups?.name || null,
        location: member.location,
        date_of_birth: member.date_of_birth,
        status: member.status,
        image_url: member.image_url,
        created_at: member.created_at,
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

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('id, name')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.phone && member.phone.includes(searchTerm)) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = selectedGroup === "all" || member.group_id === selectedGroup
    return matchesSearch && matchesGroup
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name and phone number.",
        variant: "destructive"
      })
      return
    }

    let imageUrl = formData.imageUrl
    
    // Upload image if provided
    if (imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `member-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('member-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('member-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      } catch (error) {
        console.error('Error uploading image:', error)
        toast({
          title: "Image Upload Failed",
          description: "Failed to upload image, but member will be saved without image.",
          variant: "destructive"
        })
      }
    }

    try {
      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from('anaji_members')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            group_id: formData.group || null,
            location: formData.location || null,
            date_of_birth: (formData.day && formData.month && formData.year) 
              ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}` 
              : null,
            image_url: imageUrl || null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
          })
          .eq('id', editingMember.id)

        if (error) throw error

        toast({
          title: "Member Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Create new member
        const { error } = await supabase
          .from('anaji_members')
          .insert({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            group_id: formData.group || null,
            location: formData.location || null,
            date_of_birth: (formData.day && formData.month && formData.year) 
              ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}` 
              : null,
            image_url: imageUrl || null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
          })

        if (error) throw error

        toast({
          title: "Member Added",
          description: `${formData.name} has been added successfully.`,
        })
      }

      // Reload members
      await loadMembers()
      
      // Reset form
      setFormData({ name: "", phone: "", email: "", group: "", location: "", day: "", month: "", year: "", imageUrl: "", emergencyContactName: "", emergencyContactPhone: "" })
      setImageFile(null)
      setImagePreview(null)
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
    
    // Parse date of birth if available
    let day = "", month = "", year = ""
    if (member.date_of_birth) {
      const date = new Date(member.date_of_birth)
      day = date.getDate().toString()
      month = (date.getMonth() + 1).toString()
      year = date.getFullYear().toString()
    }
    
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      group: member.group_id || '',
      location: member.location || '',
      day,
      month,
      year,
      imageUrl: member.image_url || '',
      emergencyContactName: (member as any).emergency_contact_name || '',
      emergencyContactPhone: (member as any).emergency_contact_phone || ''
    })
    setImagePreview(member.image_url)
    setImageFile(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      try {
        const { error } = await supabase
          .from('anaji_members')
          .delete()
          .eq('id', memberId)

        if (error) throw error

        toast({
          title: "Member Removed",
          description: `${member.name} has been removed.`
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

  const toggleStatus = async (memberId: string, currentStatus: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      try {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        const { error } = await supabase
          .from('anaji_members')
          .update({ status: newStatus })
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
    setFormData({ name: "", phone: "", email: "", group: "", location: "", day: "", month: "", year: "", imageUrl: "", emergencyContactName: "", emergencyContactPhone: "" })
    setImageFile(null)
    setImagePreview(null)
    setIsDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({...formData, imageUrl: ""})
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Member" : "Add New Member"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Profile Image (Optional)</Label>
                <div className="flex items-center space-x-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a profile image (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>
              </div>
              
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
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Date of Birth</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="day" className="text-sm">Day</Label>
                    <Select 
                      value={formData.day || ""} 
                      onValueChange={(value) => setFormData({...formData, day: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month" className="text-sm">Month</Label>
                    <Select 
                      value={formData.month || ""} 
                      onValueChange={(value) => setFormData({...formData, month: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ].map((month, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year" className="text-sm">Year</Label>
                    <Select 
                      value={formData.year || ""} 
                      onValueChange={(value) => setFormData({...formData, year: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Emergency Contact</Label>
                <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Full Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                </div>
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
            <SelectItem value="all">All Categories</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
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
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {member.image_url ? (
                        <img 
                          src={member.image_url} 
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
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
                    {member.group_name ? (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{member.group_name}</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No Group</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(member.id, member.status)}
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