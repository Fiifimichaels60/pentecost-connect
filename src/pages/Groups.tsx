import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, Search, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Group {
  id: string
  name: string
  description: string
  memberCount: number
  createdDate: string
  leader: string
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Youth Ministry",
      description: "Young adults and teenagers ministry group",
      memberCount: 45,
      createdDate: "2024-01-15",
      leader: "Pastor John"
    },
    {
      id: "2",
      name: "Men's Fellowship",
      description: "Fellowship for all men in the church",
      memberCount: 32,
      createdDate: "2024-01-10",
      leader: "Elder Smith"
    },
    {
      id: "3",
      name: "Women's Fellowship",
      description: "Women's ministry and prayer group",
      memberCount: 58,
      createdDate: "2024-01-08",
      leader: "Deaconess Mary"
    },
    {
      id: "4",
      name: "Church Choir",
      description: "Music ministry and praise team",
      memberCount: 28,
      createdDate: "2024-02-01",
      leader: "Musician David"
    },
    {
      id: "5",
      name: "Church Elders",
      description: "Church leadership and elders",
      memberCount: 12,
      createdDate: "2024-01-01",
      leader: "Senior Pastor"
    },
    {
      id: "6",
      name: "Ushering Team",
      description: "Sunday service ushering ministry",
      memberCount: 20,
      createdDate: "2024-01-20",
      leader: "Head Usher"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leader: ""
  })

  const { toast } = useToast()

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a group name.",
        variant: "destructive"
      })
      return
    }

    if (editingGroup) {
      // Update existing group
      setGroups(groups.map(group => 
        group.id === editingGroup.id 
          ? { ...group, ...formData }
          : group
      ))
      toast({
        title: "Group Updated",
        description: `${formData.name} has been updated successfully.`
      })
    } else {
      // Create new group
      const newGroup: Group = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        leader: formData.leader,
        memberCount: 0,
        createdDate: new Date().toISOString().split('T')[0]
      }
      setGroups([...groups, newGroup])
      toast({
        title: "Group Created",
        description: `${formData.name} has been created successfully.`
      })
    }

    // Reset form
    setFormData({ name: "", description: "", leader: "" })
    setEditingGroup(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      leader: group.leader
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group) {
      setGroups(groups.filter(g => g.id !== groupId))
      toast({
        title: "Group Deleted",
        description: `${group.name} has been deleted.`
      })
    }
  }

  const handleNewGroup = () => {
    setEditingGroup(null)
    setFormData({ name: "", description: "", leader: "" })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Groups Management</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewGroup}>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create New Group"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter group description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leader">Group Leader</Label>
                <Input
                  id="leader"
                  value={formData.leader}
                  onChange={(e) => setFormData({...formData, leader: e.target.value})}
                  placeholder="Enter leader name"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingGroup ? "Update Group" : "Create Group"}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant="secondary">
                  {group.memberCount} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {group.description || "No description provided"}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leader:</span>
                  <span className="font-medium">{group.leader || "Not assigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(group.createdDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(group)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Members
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(group.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first group"}
          </p>
          {!searchTerm && (
            <Button onClick={handleNewGroup}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default Groups