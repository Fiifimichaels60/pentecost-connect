import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Plus, Edit, Trash2, Search, Download, Users, CheckCircle, Clock, UserCheck, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface AttendanceSession {
  id: string
  title: string
  date: string
  type: string
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
  const [sessions, setSessions] = useState<AttendanceSession[]>([
    {
      id: "1",
      title: "Sunday Service",
      date: "2024-03-17",
      type: "Service",
      totalMembers: 245,
      presentCount: 198,
      absentCount: 47,
      status: "completed",
      createdBy: "Pastor John",
      notes: "Great turnout for communion service"
    },
    {
      id: "2", 
      title: "Youth Ministry Meeting",
      date: "2024-03-15",
      type: "Meeting",
      totalMembers: 45,
      presentCount: 38,
      absentCount: 7,
      status: "completed",
      createdBy: "Youth Leader",
      notes: "Discussed upcoming youth camp"
    },
    {
      id: "3",
      title: "Prayer Meeting",
      date: "2024-03-14",
      type: "Prayer",
      totalMembers: 89,
      presentCount: 67,
      absentCount: 22,
      status: "completed",
      createdBy: "Elder Mary",
      notes: "Powerful prayer session"
    },
    {
      id: "4",
      title: "Bible Study",
      date: new Date().toISOString().split('T')[0],
      type: "Study",
      totalMembers: 56,
      presentCount: 0,
      absentCount: 0,
      status: "active",
      createdBy: "Pastor John",
      notes: "Weekly Bible study session"
    }
  ])

  const [members] = useState<Member[]>([
    { id: "1", name: "John Doe", group: "Men's Fellowship", present: false, phone: "+233241234567", lastAttended: "2024-03-10" },
    { id: "2", name: "Mary Johnson", group: "Women's Fellowship", present: false, phone: "+233501234567", lastAttended: "2024-03-17" },
    { id: "3", name: "David Wilson", group: "Church Choir", present: false, phone: "+233261234567", lastAttended: "2024-03-15" },
    { id: "4", name: "Sarah Brown", group: "Youth Ministry", present: false, phone: "+233271234567", lastAttended: "2024-03-14" },
    { id: "5", name: "Michael Davis", group: "Ushering Team", present: false, phone: "+233281234567", lastAttended: "2024-03-12" },
    { id: "6", name: "Grace Thompson", group: "Women's Fellowship", present: false, phone: "+233291234567", lastAttended: "2024-03-17" },
    { id: "7", name: "Emmanuel Asante", group: "Men's Fellowship", present: false, phone: "+233201234567", lastAttended: "2024-03-10" },
    { id: "8", name: "Akosua Mensah", group: "Women's Fellowship", present: false, phone: "+233211234567", lastAttended: "2024-03-17" },
    { id: "9", name: "Kwame Osei", group: "Youth Ministry", present: false, phone: "+233221234567", lastAttended: "2024-03-15" },
    { id: "10", name: "Ama Boateng", group: "Church Choir", present: false, phone: "+233231234567", lastAttended: "2024-03-14" }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterGroup, setFilterGroup] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [attendanceMembers, setAttendanceMembers] = useState<Member[]>([])
  const [bulkAction, setBulkAction] = useState<"present" | "absent" | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    type: "Service",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const { toast } = useToast()

  const sessionTypes = ["Service", "Meeting", "Prayer", "Event", "Training"]
  const groups = ["Men's Fellowship", "Women's Fellowship", "Youth Ministry", "Church Choir", "Ushering Team"]

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMembers = attendanceMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = filterGroup === "all" || member.group === filterGroup
    return matchesSearch && matchesGroup
  })

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a session title.",
        variant: "destructive"
      })
      return
    }

    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      title: formData.title,
      date: formData.date,
      type: formData.type,
      totalMembers: members.length,
      presentCount: 0,
      absentCount: members.length,
      status: "active",
      createdBy: "Current User",
      notes: formData.notes
    }

    setSessions([newSession, ...sessions])
    setFormData({ title: "", type: "Service", date: new Date().toISOString().split('T')[0], notes: "" })
    setIsDialogOpen(false)
    
    toast({
      title: "Session Created",
      description: `${formData.title} attendance session has been created.`
    })
  }

  const handleMarkAttendance = (session: AttendanceSession) => {
    setCurrentSession(session)
    setAttendanceMembers(members.map(m => ({ ...m, present: false })))
    setIsMarkingAttendance(true)
    setSearchTerm("")
    setFilterGroup("all")
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

  const saveAttendance = () => {
    if (!currentSession) return

    const presentCount = attendanceMembers.filter(m => m.present).length
    const absentCount = attendanceMembers.length - presentCount

    setSessions(sessions.map(session =>
      session.id === currentSession.id
        ? { ...session, presentCount, absentCount, status: "completed" as const }
        : session
    ))

    setIsMarkingAttendance(false)
    setCurrentSession(null)
    
    toast({
      title: "Attendance Saved",
      description: `Marked ${presentCount} members as present.`
    })
  }

  const handleDelete = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast({
        title: "Session Deleted",
        description: `${session.title} has been deleted.`
      })
    }
  }

  const handleExport = (format: "csv" | "pdf") => {
    toast({
      title: "Export Started",
      description: `Exporting attendance data as ${format.toUpperCase()}...`
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
              {groups.map((group) => (
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
          {groups.map((group) => (
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
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
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
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
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