import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Plus, Edit, Trash2, Search, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Admin {
  id: string
  user_id: string
  name: string
  email: string
  role: string
  permissions: string[]
  is_active: boolean
  created_at: string
}

const MENU_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Members' },
  { id: 'groups', label: 'Groups' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'compose', label: 'Compose SMS' },
  { id: 'history', label: 'History' },
  { id: 'birthday', label: 'Birthdays' },
  { id: 'templates', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
  { id: 'admin_management', label: 'Admin Management' },
]

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full access to all features' },
  { value: 'admin', label: 'Admin', description: 'Manage most features' },
  { value: 'editor', label: 'Editor', description: 'Edit content and members' },
  { value: 'viewer', label: 'Viewer', description: 'View only access' },
]

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer",
    permissions: [] as string[]
  })
  const { toast } = useToast()

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedAdmins = (data || []).map(admin => ({
        id: admin.id,
        user_id: admin.user_id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        is_active: admin.is_active,
        created_at: admin.created_at,
        permissions: Array.isArray(admin.permissions) 
          ? (admin.permissions as string[])
          : []
      }))

      setAdmins(formattedAdmins)
    } catch (error) {
      console.error('Error loading admins:', error)
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and email.",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingAdmin) {
        // Update existing admin
        const { error } = await supabase
          .from('anaji_admin_users')
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions
          })
          .eq('id', editingAdmin.id)

        if (error) throw error

        toast({
          title: "Admin Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        // Note: This requires the user_id from auth.users
        // In a real scenario, you'd need to create a user first or get their ID
        toast({
          title: "Info",
          description: "To add a new admin, they must first sign up in the app. Then you can update their role here.",
          variant: "destructive"
        })
        return
      }

      await loadAdmins()
      setFormData({ name: "", email: "", role: "viewer", permissions: [] })
      setEditingAdmin(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving admin:', error)
      toast({
        title: "Error",
        description: "Failed to save admin",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (adminId: string) => {
    const admin = admins.find(a => a.id === adminId)
    if (admin && admin.role === 'super_admin') {
      toast({
        title: "Cannot Delete",
        description: "Super admins cannot be deleted for security reasons.",
        variant: "destructive"
      })
      return
    }

    if (admin) {
      try {
        const { error } = await supabase
          .from('anaji_admin_users')
          .delete()
          .eq('id', adminId)

        if (error) throw error

        toast({
          title: "Admin Removed",
          description: `${admin.name} has been removed.`
        })
        
        await loadAdmins()
      } catch (error) {
        console.error('Error deleting admin:', error)
        toast({
          title: "Error",
          description: "Failed to delete admin",
          variant: "destructive"
        })
      }
    }
  }

  const toggleStatus = async (adminId: string, currentStatus: boolean) => {
    const admin = admins.find(a => a.id === adminId)
    if (admin && admin.role === 'super_admin') {
      toast({
        title: "Cannot Deactivate",
        description: "Super admins cannot be deactivated.",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('anaji_admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

      if (error) throw error
      
      await loadAdmins()
      toast({
        title: "Status Updated",
        description: "Admin status has been updated."
      })
    } catch (error) {
      console.error('Error updating admin status:', error)
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      })
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'editor':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Management</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAdmin(null)
              setFormData({ name: "", email: "", role: "viewer", permissions: [] })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@example.com"
                  required
                  disabled={!!editingAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <p className="font-medium">{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Menu Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Select which menu items this admin can access
                </p>
                <div className="space-y-2 border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {MENU_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <Label
                        htmlFor={permission.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAdmin ? "Update Admin" : "Add Admin"}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{admins.filter(a => a.is_active).length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{admins.filter(a => a.role === 'super_admin').length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{admins.filter(a => !a.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search admins by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Admins Table */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No admins found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <p className="font-medium">{admin.name}</p>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(admin.role)}>
                        {ADMIN_ROLES.find(r => r.value === admin.role)?.label || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.length > 0 ? (
                          admin.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {MENU_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No permissions</span>
                        )}
                        {admin.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(admin.id, admin.is_active)}
                      >
                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={admin.role === 'super_admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminManagement
