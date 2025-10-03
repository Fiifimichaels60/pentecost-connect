import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, Search, UserPlus, Phone, Mail, Send, MessageSquare, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Group {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [sendingSMS, setSendingSMS] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedGroups = (data || []).map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || 'No description',
        memberCount: group.member_count,
        createdAt: group.created_at
      }))

      setGroups(formattedGroups)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    try {
      setLoadingMembers(true)
      const { data, error } = await supabase
        .from('anaji_member_groups')
        .select(`
          member_id,
          anaji_members (
            id,
            name,
            phone,
            email,
            status
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error

      // Flatten the data structure
      const formattedMembers = (data || [])
        .map(item => item.anaji_members)
        .filter(member => member !== null);

      setGroupMembers(formattedMembers)
    } catch (error) {
      console.error('Error loading group members:', error)
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive"
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  const loadAvailableMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_members')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      setAvailableMembers(data || [])
    } catch (error) {
      console.error('Error loading available members:', error)
      toast({
        title: "Error",
        description: "Failed to load available members",
        variant: "destructive"
      })
    }
  }

  const filteredAvailableMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.phone.includes(memberSearchTerm)
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a group name.",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingGroup) {
        // Update existing group
        const { error } = await supabase
          .from('anaji_groups')
          .update({
            name: formData.name,
            description: formData.description
          })
          .eq('id', editingGroup.id)

        if (error) throw error

        toast({
          title: "Group Updated",
          description: `${formData.name} has been updated successfully.`
        })
      } else {
        // Create new group
        const { error } = await supabase
          .from('anaji_groups')
          .insert({
            name: formData.name,
            description: formData.description,
            member_count: 0
          })

        if (error) throw error

        toast({
          title: "Group Created",
          description: `${formData.name} has been created successfully.`
        })
      }

      // Reload groups
      await loadGroups()
      
      // Reset form
      setFormData({ name: "", description: "" })
      setEditingGroup(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving group:', error)
      toast({
        title: "Error",
        description: "Failed to save group",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group) {
      try {
        const { error } = await supabase
          .from('anaji_groups')
          .delete()
          .eq('id', groupId)

        if (error) throw error

        toast({
          title: "Group Deleted",
          description: `${group.name} has been deleted.`
        })
        
        await loadGroups()
      } catch (error) {
        console.error('Error deleting group:', error)
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive"
        })
      }
    }
  }

  const handleManageMembers = async (group: Group) => {
    setSelectedGroup(group)
    await loadGroupMembers(group.id)
    await loadAvailableMembers()
    setIsMemberDialogOpen(true)
  }

  const handleSendGroupSMS = async (group: Group) => {
    setSelectedGroup(group)
    setSmsMessage("")
    setIsSMSDialogOpen(true)
  }

  const sendGroupSMS = async () => {
    if (!selectedGroup || !smsMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a message to send.",
        variant: "destructive"
      })
      return
    }

    try {
      setSendingSMS(true)
      
      // Get group members using the junction table
      const { data: memberGroupData, error: memberError } = await supabase
        .from('anaji_member_groups')
        .select(`
          anaji_members!inner (
            phone,
            status
          )
        `)
        .eq('group_id', selectedGroup.id)
      
      if (memberError) throw memberError
      
      // Extract phone numbers from active members
      const recipients = memberGroupData
        .map(item => item.anaji_members?.phone)
        .filter(phone => phone && phone.trim() !== '');
      
      if (recipients.length === 0) {
        throw new Error('No active members with phone numbers found in this group')
      }

      // Call the SMS edge function
      const { data: result, error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignName: `Group SMS: ${selectedGroup.name} - ${new Date().toLocaleDateString()}`,
          message: smsMessage,
          recipients,
          recipientType: 'group',
          recipientName: selectedGroup.name,
          groupId: selectedGroup.id
        }
      })

      if (smsError) throw smsError

      if (!result.success) {
        throw new Error(result.error || 'Failed to send SMS')
      }

      toast({
        title: "SMS Sent Successfully!",
        description: `Message sent to ${result.delivered} members in ${selectedGroup.name}.`
      })

      setIsSMSDialogOpen(false)
      setSmsMessage("")
      setSelectedGroup(null)
      
    } catch (error) {
      console.error('Error sending group SMS:', error)
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS to group.",
        variant: "destructive"
      })
    } finally {
      setSendingSMS(false)
    }
  }

  const addMemberToGroup = async (memberId: string) => {
    if (!selectedGroup) return

    try {
      const { error } = await supabase
        .from('anaji_member_groups')
        .insert({
          member_id: memberId,
          group_id: selectedGroup.id
        })

      if (error) throw error

      await loadGroupMembers(selectedGroup.id)
      await loadAvailableMembers()
      await loadGroups()

      toast({
        title: "Member Added",
        description: "Member has been added to the group successfully."
      })
    } catch (error) {
      console.error('Error adding member to group:', error)
      toast({
        title: "Error",
        description: error.message === 'duplicate key value violates unique constraint "anaji_member_groups_member_id_group_id_key"' 
          ? "Member is already in this group" 
          : "Failed to add member to group",
        variant: "destructive"
      })
    }
  }

  const removeMemberFromGroup = async (memberId: string) => {
    if (!selectedGroup) return

    try {
      const { error } = await supabase
        .from('anaji_member_groups')
        .delete()
        .eq('member_id', memberId)
        .eq('group_id', selectedGroup.id)

      if (error) throw error

      await loadGroupMembers(selectedGroup.id)
      await loadAvailableMembers()
      await loadGroups()

      toast({
        title: "Member Removed",
        description: "Member has been removed from the group."
      })
    } catch (error) {
      console.error('Error removing member from group:', error)
      toast({
        title: "Error",
        description: "Failed to remove member from group",
        variant: "destructive"
      })
    }
  }

  const handleNewGroup = () => {
    setEditingGroup(null)
    setFormData({ name: "", description: "" })
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
        {loading ? (
          <div className="col-span-full text-center py-8">
            Loading groups...
          </div>
        ) : filteredGroups.map((group) => (
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
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(group.createdAt).toLocaleDateString()}
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
                  onClick={() => handleManageMembers(group)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Members
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendGroupSMS(group)}
                >
                  <Send className="h-4 w-4 mr-1" />
                  SMS
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

      {filteredGroups.length === 0 && !loading && (
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

      {/* Member Management Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Members - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Group Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Current Members</h3>
                <Badge variant="secondary">{groupMembers.length} members</Badge>
              </div>
              
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading members...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMemberFromGroup(member.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {groupMembers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No members in this group</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Members</h3>
                <Badge variant="outline">{availableMembers.length} available</Badge>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search available members..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAvailableMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMemberToGroup(member.id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
                {filteredAvailableMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {memberSearchTerm ? "No members found" : "No available members"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group SMS Dialog */}
      <Dialog open={isSMSDialogOpen} onOpenChange={setIsSMSDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send SMS to {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recipients:</span>
                <span className="font-medium">{selectedGroup?.memberCount || 0} members</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="font-medium text-primary">
                  GH₵{((selectedGroup?.memberCount || 0) * Math.ceil(smsMessage.length / 160) * 0.05).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Type your message here..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="min-h-32"
                disabled={sendingSMS}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{smsMessage.length} characters</span>
                <span>{Math.ceil(smsMessage.length / 160)} SMS</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={sendGroupSMS} 
                className="flex-1"
                disabled={sendingSMS || !smsMessage.trim()}
              >
                {sendingSMS ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSMSDialogOpen(false)}
                disabled={sendingSMS}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Groups