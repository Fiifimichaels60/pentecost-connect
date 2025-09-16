import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { History as HistoryIcon, Search, Trash2, Eye, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SMSHistory {
  id: string
  message: string
  recipients: string[]
  recipientType: "individual" | "group" | "manual"
  recipientName: string
  status: "sent" | "delivered" | "failed" | "pending"
  sentDate: string
  sentTime: string
  deliveredCount: number
  failedCount: number
  totalCount: number
  cost: number
}

const History = () => {
  const [history, setHistory] = useState<SMSHistory[]>([
    {
      id: "1",
      message: "Good morning! Don't forget our Sunday worship service at 9:00 AM. Come and experience God's presence with us. God bless you!",
      recipients: ["+233 24 123 4567", "+233 54 987 6543"],
      recipientType: "group",
      recipientName: "Youth Ministry",
      status: "delivered",
      sentDate: "2024-03-17",
      sentTime: "08:30",
      deliveredCount: 43,
      failedCount: 2,
      totalCount: 45,
      cost: 4.50
    },
    {
      id: "2",
      message: "Happy Birthday John! May this special day bring you joy, happiness, and God's abundant blessings. We pray for a wonderful year ahead filled with His grace. 🎉🎂",
      recipients: ["+233 24 123 4567"],
      recipientType: "individual",
      recipientName: "John Doe",
      status: "delivered",
      sentDate: "2024-03-15",
      sentTime: "09:00",
      deliveredCount: 1,
      failedCount: 0,
      totalCount: 1,
      cost: 0.10
    },
    {
      id: "3",
      message: "Join us for our midweek prayer meeting tonight at 7:00 PM. Let's come together to seek God's face and pray for our community. Your presence matters!",
      recipients: ["+233 20 555 7890", "+233 26 111 2222", "+233 55 333 4444"],
      recipientType: "group",
      recipientName: "Prayer Warriors",
      status: "sent",
      sentDate: "2024-03-14",
      sentTime: "15:30",
      deliveredCount: 28,
      failedCount: 1,
      totalCount: 29,
      cost: 2.90
    },
    {
      id: "4",
      message: "Reminder: Church Annual Conference is scheduled for March 25, 2024 at 9:00 AM. Location: Main Auditorium. Don't miss this blessing! See you there.",
      recipients: ["+233 24 555 6666"],
      recipientType: "manual",
      recipientName: "Manual Recipients",
      status: "failed",
      sentDate: "2024-03-13",
      sentTime: "10:15",
      deliveredCount: 0,
      failedCount: 1,
      totalCount: 1,
      cost: 0.00
    },
    {
      id: "5",
      message: "Welcome to Church Of Pentecost, Anaji English Assembly, Sarah! We're thrilled to have you join our church family. May God bless your journey with us.",
      recipients: ["+233 26 111 2222"],
      recipientType: "individual",
      recipientName: "Sarah Brown",
      status: "pending",
      sentDate: "2024-03-12",
      sentTime: "14:45",
      deliveredCount: 0,
      failedCount: 0,
      totalCount: 1,
      cost: 0.10
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showMessageDetails, setShowMessageDetails] = useState<string | null>(null)

  const { toast } = useToast()

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.recipientType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredHistory.map(item => item.id))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to delete.",
        variant: "destructive"
      })
      return
    }

    setHistory(history.filter(item => !selectedItems.includes(item.id)))
    setSelectedItems([])
    toast({
      title: "Items Deleted",
      description: `${selectedItems.length} items have been deleted.`
    })
  }

  const handleDeleteSingle = (itemId: string) => {
    setHistory(history.filter(item => item.id !== itemId))
    toast({
      title: "Item Deleted",
      description: "SMS history item has been deleted."
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "sent":
        return <Clock className="h-4 w-4 text-primary" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "sent":
        return "secondary"
      case "failed":
        return "destructive"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const totalStats = {
    sent: history.reduce((sum, item) => sum + item.deliveredCount, 0),
    failed: history.reduce((sum, item) => sum + item.failedCount, 0),
    cost: history.reduce((sum, item) => sum + item.cost, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">SMS History</h1>
        </div>
        {selectedItems.length > 0 && (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedItems.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalStats.sent}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalStats.failed}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalStats.cost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages or recipients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === filteredHistory.length && filteredHistory.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium truncate">
                        {item.message.length > 50 ? `${item.message.substring(0, 50)}...` : item.message}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil(item.message.length / 160)} SMS
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.message.length} chars
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{item.recipientName}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.recipientType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <Badge variant={getStatusColor(item.status) as any}>
                        {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{new Date(item.sentDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{item.sentTime}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-sm font-medium">{item.deliveredCount}</span>
                      </div>
                      {item.failedCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-sm">{item.failedCount}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        of {item.totalCount}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">GH₵{item.cost.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowMessageDetails(
                          showMessageDetails === item.id ? null : item.id
                        )}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteSingle(item.id)}
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
          
          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SMS History Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters" 
                  : "Your SMS history will appear here once you start sending messages"
                }
              </p>
              {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setTypeFilter("all")
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Details Modal */}
      {showMessageDetails && (
        <Card className="shadow-elegant border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Message Details</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMessageDetails(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const item = history.find(h => h.id === showMessageDetails)
              if (!item) return null
              
              return (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Message</Label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">{item.message}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Recipient</Label>
                      <p className="mt-1 font-medium">{item.recipientName}</p>
                      <Badge variant="outline" className="mt-1">
                        {item.recipientType}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1 flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <Badge variant={getStatusColor(item.status) as any}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Delivered</Label>
                      <p className="mt-1 text-lg font-bold text-success">{item.deliveredCount}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Failed</Label>
                      <p className="mt-1 text-lg font-bold text-destructive">{item.failedCount}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cost</Label>
                      <p className="mt-1 text-lg font-bold">GH₵{item.cost.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Recipients ({item.recipients.length})</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <div className="space-y-1">
                        {item.recipients.map((recipient, index) => (
                          <div key={index} className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                            {recipient}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default History