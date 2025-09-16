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
import { Calendar, Plus, Edit, Trash2, Search, Download, Users, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AttendanceSession {
  id: string
  title: string
  date: string
  type: string
  totalMembers: number
  presentCount: number
  absentCount: number
  status: "active" | "completed"
}

interface Member {
  id: string
  name: string
  group: string
  present: boolean
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
      status: "completed"
    },
    {
      id: "2", 
      title: "Youth Ministry Meeting",
      date: "2024-03-15",
      type: "Meeting",
      totalMembers: 45,
      presentCount: 38,
      absentCount: 7,
      status: "completed"
    },
    {
      id: "3",
      title: "Prayer Meeting",
      date: "2024-03-14",
      type: "Prayer",
      totalMembers: 89,
      presentCount: 67,
      absentCount: 22,
      status: "completed"
    }
  ])

  const [members] = useState<Member[]>([
    { id: "1", name: "John Doe", group: "Men's Fellowship", present: false },
    { id: "2", name: "Mary Johnson", group: "Women's Fellowship", present: false },
    { id: "3", name: "David Wilson", group: "Church Choir", present: false },
    { id: "4", name: "Sarah Brown", group: "Youth Ministry", present: false },
    { id: "5", name: "Michael Davis", group: "Ushering Team", present: false },
    { id: "6", name: "Grace Thompson", group: "Women's Fellowship", present: false }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [attendanceMembers, setAttendanceMembers] = useState<Member[]>([])
  const [formData, setFormData] = useState({
    title: "",
    type: "Service",
    date: new Date().toISOString().split('T')[0]
  })

  const { toast } = useToast()

  const sessionTypes = ["Service", "Meeting", "Prayer", "Event", "Training"]

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      status: "active"
    }

    setSessions([newSession, ...sessions])
    setFormData({ title: "", type: "Service", date: new Date().toISOString().split('T')[0] })
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
  }

  const toggleMemberAttendance = (memberId: string) => {
    setAttendanceMembers(attendanceMembers.map(member =>
      member.id === memberId ? { ...member, present: !member.present } : member
    ))
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

  if (isMarkingAttendance && currentSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mark Attendance - {currentSession.title}</h1>
        </div>

        <div className="flex justify-between">
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

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Members List</CardTitle>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Members: {attendanceMembers.length}</span>
              <span>Present: {attendanceMembers.filter(m => m.present).length}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    checked={member.present}
                    onCheckedChange={() => toggleMemberAttendance(member.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.group}</p>
                  </div>
                  <Badge variant={member.present ? "default" : "secondary"}>
                    {member.present ? "Present" : "Absent"}
                  </Badge>
                </div>
              ))}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">82%</div>
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
      </div>

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
            <Download className="h-4 w-4 mr-2" />
            Export PDF
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
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
                        {Math.round((session.presentCount / session.totalMembers) * 100)}% attendance
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.status === "completed" ? "default" : "secondary"}
                    >
                      {session.status}
                    </Badge>
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