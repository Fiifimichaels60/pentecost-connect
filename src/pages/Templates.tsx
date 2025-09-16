import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Edit, Trash2, Search, Copy, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  createdDate: string
  lastUsed?: string
  usageCount: number
}

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Sunday Service Reminder",
      category: "Service",
      content: "Good morning! Don't forget our Sunday worship service at 9:00 AM. Come and experience God's presence with us. God bless you!",
      variables: [],
      createdDate: "2024-01-15",
      lastUsed: "2024-03-17",
      usageCount: 24
    },
    {
      id: "2",
      name: "Birthday Wishes",
      category: "Birthday",
      content: "Happy Birthday {name}! May this special day bring you joy, happiness, and God's abundant blessings. We pray for a wonderful year ahead filled with His grace. 🎉🎂",
      variables: ["name"],
      createdDate: "2024-01-20",
      lastUsed: "2024-03-15",
      usageCount: 18
    },
    {
      id: "3",
      name: "Prayer Meeting Invitation",
      category: "Meeting",
      content: "Join us for our midweek prayer meeting tonight at 7:00 PM. Let's come together to seek God's face and pray for our community. Your presence matters!",
      variables: [],
      createdDate: "2024-02-01",
      lastUsed: "2024-03-14",
      usageCount: 12
    },
    {
      id: "4",
      name: "Event Reminder",
      category: "Event",
      content: "Reminder: {event_name} is scheduled for {date} at {time}. Location: {location}. Don't miss this blessing! See you there.",
      variables: ["event_name", "date", "time", "location"],
      createdDate: "2024-02-10",
      usageCount: 8
    },
    {
      id: "5",
      name: "Welcome New Member",
      category: "Welcome",
      content: "Welcome to Church Of Pentecost, Anaji English Assembly, {name}! We're thrilled to have you join our church family. May God bless your journey with us.",
      variables: ["name"],
      createdDate: "2024-02-15",
      usageCount: 5
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "Service",
    content: ""
  })

  const { toast } = useToast()

  const categories = ["Service", "Meeting", "Event", "Birthday", "Welcome", "Announcement", "Prayer"]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g)
    return matches ? matches.map(match => match.slice(1, -1)) : []
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in template name and content.",
        variant: "destructive"
      })
      return
    }

    const variables = extractVariables(formData.content)

    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(template => 
        template.id === editingTemplate.id 
          ? { ...template, ...formData, variables }
          : template
      ))
      toast({
        title: "Template Updated",
        description: `${formData.name} has been updated successfully.`
      })
    } else {
      // Create new template
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        content: formData.content,
        variables,
        createdDate: new Date().toISOString().split('T')[0],
        usageCount: 0
      }
      setTemplates([...templates, newTemplate])
      toast({
        title: "Template Created",
        description: `${formData.name} has been created successfully.`
      })
    }

    // Reset form
    setFormData({ name: "", category: "Service", content: "" })
    setEditingTemplate(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setTemplates(templates.filter(t => t.id !== templateId))
      toast({
        title: "Template Deleted",
        description: `${template.name} has been deleted.`
      })
    }
  }

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content)
    toast({
      title: "Template Copied",
      description: "Template content has been copied to clipboard."
    })
  }

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setFormData({ name: "", category: "Service", content: "" })
    setIsDialogOpen(true)
  }

  const handleUseTemplate = (template: Template) => {
    // In a real app, this would navigate to compose page with template pre-filled
    setTemplates(templates.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString().split('T')[0] }
        : t
    ))
    toast({
      title: "Template Selected",
      description: "Template has been loaded in the compose area."
    })
  }

  const getCategoryStats = () => {
    const stats = categories.reduce((acc, category) => {
      acc[category] = templates.filter(t => t.category === category).length
      return acc
    }, {} as Record<string, number>)
    return stats
  }

  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">SMS Templates</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Template Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter your template content. Use {variable_name} for dynamic content."
                  className="min-h-32"
                  required
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formData.content.length} characters</span>
                  <span>{Math.ceil(formData.content.length / 160)} SMS</span>
                </div>
              </div>
              
              {/* Variables Preview */}
              {formData.content && extractVariables(formData.content).length > 0 && (
                <div className="space-y-2">
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(formData.content).map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">Variable Usage Tips:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Use {"{name}"} for person's name</li>
                  <li>• Use {"{date}"} for dates</li>
                  <li>• Use {"{time}"} for time</li>
                  <li>• Use {"{event_name}"} for event names</li>
                </ul>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? "Update Template" : "Create Template"}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {templates.reduce((max, t) => t.usageCount > max.usageCount ? t : max, templates[0])?.name || "None"}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(categoryStats).filter(k => categoryStats[k] > 0).length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {templates.reduce((sum, t) => sum + t.usageCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category} ({categoryStats[category] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="shadow-elegant hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.variables.length > 0 && (
                      <Badge variant="secondary">
                        {template.variables.length} variable{template.variables.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Template Content:</p>
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  {template.content}
                </div>
              </div>

              {template.variables.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>Created: {new Date(template.createdDate).toLocaleDateString()}</p>
                  {template.lastUsed && (
                    <p>Last used: {new Date(template.lastUsed).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>Used {template.usageCount} times</p>
                </div>
              </div>

              <Button 
                onClick={() => handleUseTemplate(template)} 
                className="w-full"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== "all" 
              ? "Try adjusting your filters" 
              : "Get started by creating your first SMS template"
            }
          </p>
          {!searchTerm && selectedCategory === "all" && (
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default Templates