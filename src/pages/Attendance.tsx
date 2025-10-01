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
import { Calendar, Plus, Edit, Trash2, Search, Download, Users, CheckCircle, Clock, UserCheck, AlertCircle, FileText, CalendarIcon, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface AttendanceSession {
  id: string
  title: string
  date: string
  type: string
  group_id: string | null
  group_name: string | null
  totalMembers: number
  presentCount: number
  absentCount: number
  status: "active" | "completed"
  createdBy?: string
  notes?: string
}

interface Member {
  id: string
  name: string
  group: string
  present: boolean
  phone?: string
  lastAttended?: string
}

const Attendance = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Load data from database
  useEffect(() => {
    loadSessions()
    loadMembers()
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('id, name, member_count')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          anaji_groups(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedSessions = (data || []).map(session => ({
        id: session.id,
        title: session.title,
        date: session.date,
        type: session.type,
        group_id: session.group_id,
        group_name: session.anaji_groups?.name || null,
        totalMembers: session.total_members,
        presentCount: session.present_count,
        absentCount: session.absent_count,
        status: session.status as "active" | "completed",
        createdBy: session.created_by || "Unknown",
        notes: session.notes || ""
      }))

      setSessions(formattedSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_members')
        .select(`
          *,
          anaji_groups(name)
        `)
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      const formattedMembers = (data || []).map(member => ({
        id: member.id,
        name: member.name,
        group: member.anaji_groups?.name || "No Group",
        present: false,
        phone: member.phone,
        lastAttended: "2024-01-01" // This would come from attendance records in real implementation
      }))

      setMembers(formattedMembers)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [filterGroup, setFilterGroup] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [attendanceMembers, setAttendanceMembers] = useState<Member[]>([])
  const [bulkAction, setBulkAction] = useState<"present" | "absent" | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Service",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    groupId: ""
  })
  const [groups, setGroups] = useState<{id: string, name: string, member_count?: number}[]>([])
  const [dateFilter, setDateFilter] = useState("")

  const { toast } = useToast()

  const sessionTypes = ["Service", "Meeting", "Prayer", "Event", "Training"]
  const groupsOld = ["Men's Fellowship", "Women's Fellowship", "Youth Ministry", "Church Choir", "Ushering Team"]

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMembers = attendanceMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = filterGroup === "all" || member.group === filterGroup
    return matchesSearch && matchesGroup
  })

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a session title.",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .insert({
          title: formData.name,
          date: formData.date,
          type: formData.type,
          group_id: formData.groupId || null,
          total_members: formData.groupId ? groups.find(g => g.id === formData.groupId)?.member_count || 0 : 0,
          present_count: 0,
          absent_count: formData.groupId ? groups.find(g => g.id === formData.groupId)?.member_count || 0 : 0,
          status: "active",
          created_by: "Current User",
          notes: formData.notes
        })

      if (error) throw error

      await loadSessions()
      setFormData({ name: "", description: "", type: "Service", date: new Date().toISOString().split('T')[0], notes: "", groupId: "" })
      setIsDialogOpen(false)
      
      toast({
        title: "Session Created",
        description: `${formData.name} attendance session has been created.`
      })
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive"
      })
    }
  }

  const handleMarkAttendance = (session: AttendanceSession) => {
    setCurrentSession(session)
    loadSessionMembers(session)
    setIsMarkingAttendance(true)
    setSearchTerm("")
    setFilterGroup("all")
  }

  const loadSessionMembers = async (session: AttendanceSession) => {
    try {
      setLoadingMembers(true)
      
      let query = supabase
        .from('anaji_members')
        .select(`
          *,
          anaji_groups(name)
        `)
        .eq('status', 'active')
        .order('name')
      
      // If session has a specific group, filter by that group
      if (session.group_id) {
        query = query.eq('group_id', session.group_id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const formattedMembers = (data || []).map(member => ({
        id: member.id,
        name: member.name,
        group: member.anaji_groups?.name || "No Group",
        present: false,
        phone: member.phone,
        lastAttended: "2024-01-01" // This would come from attendance records
      }))
      
      setAttendanceMembers(formattedMembers)
    } catch (error) {
      console.error('Error loading session members:', error)
      toast({
        title: "Error",
        description: "Failed to load session members",
        variant: "destructive"
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  const toggleMemberAttendance = (memberId: string) => {
    setAttendanceMembers(attendanceMembers.map(member =>
      member.id === memberId ? { ...member, present: !member.present } : member
    ))
  }

  const handleBulkAction = (action: "present" | "absent") => {
    const updatedMembers = filteredMembers.map(member => ({
      ...member,
      present: action === "present"
    }))
    
    setAttendanceMembers(attendanceMembers.map(member => {
      const updated = updatedMembers.find(u => u.id === member.id)
      return updated || member
    }))
    
    toast({
      title: "Bulk Update",
      description: `Marked ${filteredMembers.length} members as ${action}.`
    })
  }

  const handleQuickSearch = (query: string) => {
    setSearchTerm(query)
  }

  const saveAttendance = async () => {
    if (!currentSession) return

    const presentCount = attendanceMembers.filter(m => m.present).length
    const absentCount = attendanceMembers.length - presentCount

    try {
      // Update session
      const { error: sessionError } = await supabase
        .from('attendance_sessions')
        .update({
          present_count: presentCount,
          absent_count: absentCount,
          status: "completed"
        })
        .eq('id', currentSession.id)

      if (sessionError) throw sessionError

      // Save attendance records
      const attendanceRecords = attendanceMembers.map(member => ({
        session_id: currentSession.id,
        member_id: member.id,
        present: member.present
      }))

      const { error: recordsError } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords)

      if (recordsError) throw recordsError

      await loadSessions()
      setIsMarkingAttendance(false)
      setCurrentSession(null)
      
      toast({
        title: "Attendance Saved",
        description: `Marked ${presentCount} members as present.`
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      try {
        const { error } = await supabase
          .from('attendance_sessions')
          .delete()
          .eq('id', sessionId)

        if (error) throw error

        await loadSessions()
        toast({
          title: "Session Deleted",
          description: `${session.title} has been deleted.`
        })
      } catch (error) {
        console.error('Error deleting session:', error)
        toast({
          title: "Error",
          description: "Failed to delete session",
          variant: "destructive"
        })
      }
    }
  }

  const handleExport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      exportToCSV()
    } else {
      toast({
        title: "PDF Export",
        description: "PDF export feature coming soon!"
      })
    }
  }

  const exportToCSV = () => {
    const filteredData = dateFilter 
      ? sessions.filter(s => s.date === dateFilter)
      : sessions
    
    if (filteredData.length === 0) {
      toast({
        title: "No Data to Export",
        description: dateFilter ? `No sessions found for ${new Date(dateFilter).toLocaleDateString()}` : "No sessions available to export.",
        variant: "destructive"
      })
      return
    }

    // Calculate summary for filtered data
    const totalPresent = filteredData.reduce((sum, s) => sum + s.presentCount, 0)
    const totalMembers = filteredData.reduce((sum, s) => sum + s.totalMembers, 0)
    const avgAttendance = totalMembers > 0 ? Math.round((totalPresent / totalMembers) * 100) : 0
    
    const csvContent = [
      dateFilter ? `Report Date: ${new Date(dateFilter).toLocaleDateString()}` : 'Report: All Sessions',
      `Total Sessions: ${filteredData.length}`,
      `Total Present: ${totalPresent}`,
      `Total Members: ${totalMembers}`,
      `Average Attendance: ${avgAttendance}%`,
      '',
      ['Session Title', 'Date', 'Type', 'Group', 'Total Members', 'Present', 'Absent', 'Attendance Rate', 'Status'].join(','),
      ...filteredData.map(session => [
        session.title,
        session.date,
        session.type,
        session.group_name || 'All Members',
        session.totalMembers,
        session.presentCount,
        session.absentCount,
        `${session.totalMembers > 0 ? Math.round((session.presentCount / session.totalMembers) * 100) : 0}%`,
        session.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${dateFilter || 'all'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `Exported ${filteredData.length} session(s) with ${avgAttendance}% average attendance.`
    })
  }

  const exportSessionCSV = (session: AttendanceSession) => {
    const csvContent = [
      ['Member Name', 'Group', 'Phone', 'Status'].join(','),
      ...attendanceMembers.map(member => [
        member.name,
        member.group,
        member.phone || '',
        member.present ? 'Present' : 'Absent'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title}-${session.date}-attendance.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Session Exported",
      description: `${session.title} attendance exported successfully.`
    })
  }

  const getAttendanceRate = () => {
    const totalSessions = sessions.filter(s => s.status === "completed").length
    if (totalSessions === 0) return 0
    const totalAttendance = sessions
      .filter(s => s.status === "completed")
      .reduce((sum, s) => sum + (s.presentCount / s.totalMembers), 0)
    return Math.round((totalAttendance / totalSessions) * 100)
  }

  const getRecentAbsentees = () => {
    // Mock data for demonstration
    return members.filter(m => {
      const lastAttended = new Date(m.lastAttended || "2024-01-01")
      const daysSince = Math.floor((new Date().getTime() - lastAttended.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince > 7
    }).slice(0, 5)
  }

  if (isMarkingAttendance && currentSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mark Attendance - {currentSession.title}</h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <p className="text-muted-foreground">
            {new Date(currentSession.date).toLocaleDateString()} • {currentSession.type}
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsMarkingAttendance(false)}>
              Cancel
            </Button>
            <Button onClick={saveAttendance}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Attendance
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{attendanceMembers.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Present</span>
              </div>
              <p className="text-2xl font-bold text-success">{attendanceMembers.filter(m => m.present).length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Absent</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{attendanceMembers.filter(m => !m.present).length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Rate</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {attendanceMembers.length > 0 ? Math.round((attendanceMembers.filter(m => m.present).length / attendanceMembers.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groupsOld.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction("present")}
              disabled={filteredMembers.length === 0}
            >
              Mark All Present
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkAction("absent")}
              disabled={filteredMembers.length === 0}
            >
              Mark All Absent
            </Button>
          </div>
        </div>

        {/* Quick Search Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleQuickSearch("")}>
            All Members
          </Button>
          {groupsOld.map((group) => (
            <Button 
              key={group} 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterGroup(group)
                setSearchTerm("")
              }}
            >
              {group}
            </Button>
          ))}
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>
              Members List 
              {searchTerm || filterGroup !== "all" ? (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Showing {filteredMembers.length} of {attendanceMembers.length})
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    checked={member.present}
                    onCheckedChange={() => toggleMemberAttendance(member.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{member.group}</span>
                      {member.phone && (
                        <>
                          <span>•</span>
                          <span>{member.phone}</span>
                        </>
                      )}
                      {member.lastAttended && (
                        <>
                          <span>•</span>
                          <span>Last: {new Date(member.lastAttended).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={member.present ? "default" : "secondary"}>
                    {member.present ? "Present" : "Absent"}
                  </Badge>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Attendance Management</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Attendance Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Title</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Sunday Service, Prayer Meeting"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Session Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupId">Group (Optional)</Label>
                <Select 
                  value={formData.groupId} 
                  onValueChange={(value) => setFormData({...formData, groupId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group or leave empty for all members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Members</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Add any notes about this session"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  Create Session
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{sessions.filter(s => s.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{getAttendanceRate()}%</div>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Absentees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{getRecentAbsentees().length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Absentees Alert */}
      {getRecentAbsentees().length > 0 && (
        <Card className="shadow-elegant border-l-4 border-l-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Members Needing Follow-up</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              The following members haven't attended in over a week:
            </p>
            <div className="space-y-2">
              {getRecentAbsentees().map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.group} • Last attended: {new Date(member.lastAttended || "").toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Contact
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            placeholder="Filter by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 w-full sm:w-48"
          />
        </div>
        <div className="flex space-x-2">
          {dateFilter && (
            <Button variant="outline" onClick={() => setDateFilter("")}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Date
            </Button>
          )}
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions
                .filter(session => !dateFilter || session.date === dateFilter)
                .map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{session.title}</p>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground">{session.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(session.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {session.group_name ? (
                      <Badge variant="secondary">{session.group_name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">All Members</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-success font-medium">{session.presentCount}</span>
                        {" / "}
                        <span className="text-muted-foreground">{session.totalMembers}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.totalMembers > 0 ? Math.round((session.presentCount / session.totalMembers) * 100) : 0}% attendance
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.status === "completed" ? "default" : "outline"}
                    >
                      {session.status === "active" && <Clock className="h-3 w-3 mr-1" />}
                      {session.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{session.createdBy}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {session.status === "active" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAttendance(session)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Mark
                        </Button>
                      )}
                      {session.status === "completed" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => exportSessionCSV(session)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(session.id)}
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
          
          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Sessions Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first attendance session"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Session
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Attendance