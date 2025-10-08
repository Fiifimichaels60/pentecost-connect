import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History as HistoryIcon, Search, Trash2, Eye, CheckCircle, XCircle, Clock, Filter, Calendar, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"

interface SMSHistory {
  id: string
  message: string
  recipients: string[]
  recipient_type: "individual" | "group" | "manual"
  recipient_name: string
  status: "sent" | "delivered" | "failed" | "pending"
  sent_date: string
  sent_time: string
  delivered_count: number
  failed_count: number
  recipient_count: number
  cost: number
}

interface ScheduledSMS {
  id: string
  campaign_name: string
  message: string
  recipients: string[]
  recipient_type: "single" | "group" | "manual"
  recipient_name: string
  recipient_count: number
  scheduled_date: string
  scheduled_time: string
  status: "scheduled" | "sending" | "sent" | "failed" | "cancelled"
  created_at: string
}

const History = () => {
  const [history, setHistory] = useState<SMSHistory[]>([])
  const [scheduledSMS, setScheduledSMS] = useState<ScheduledSMS[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("history")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showMessageDetails, setShowMessageDetails] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadHistory()
    loadScheduledSMS()
  }, [])

  const loadScheduledSMS = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_scheduled_sms')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false })
        .limit(200);

      if (error) throw error;

      setScheduledSMS(data || []);
    } catch (error) {
      console.error('Error loading scheduled SMS:', error)
      toast({
        title: "Error",
        description: "Failed to load scheduled SMS",
        variant: "destructive"
      })
    }
  }

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_sms_campaigns')
        .select('id, message, recipients, recipient_type, recipient_name, status, sent_at, created_at, delivered_count, failed_count, recipient_count, cost')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const mapped: SMSHistory[] = (data || []).map((c: any) => {
        const dt = c.sent_at || c.created_at;
        const dateObj = dt ? new Date(dt) : new Date();
        const type = (c.recipient_type === 'single' ? 'individual' : c.recipient_type) as SMSHistory['recipient_type'];

        return {
          id: c.id,
          message: c.message,
          recipients: (c.recipients as string[]) || [],
          recipient_type: type,
          recipient_name: c.recipient_name,
          status: (c.status as SMSHistory['status']) || 'sent',
          sent_date: dateObj.toISOString(),
          sent_time: dateObj.toTimeString().slice(0, 5),
          delivered_count: c.delivered_count ?? 0,
          failed_count: c.failed_count ?? 0,
          recipient_count: c.recipient_count ?? (((c.recipients as string[])?.length) || 0),
          cost: Number(c.cost ?? 0),
        };
      });

      setHistory(mapped);
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error",
        description: "Failed to load SMS history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelScheduled = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('anaji_scheduled_sms')
        .update({ status: 'cancelled' })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scheduled SMS cancelled successfully.",
      });

      await loadScheduledSMS();
    } catch (error) {
      console.error('Error cancelling scheduled SMS:', error)
      toast({
        title: "Error",
        description: "Failed to cancel scheduled SMS. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteScheduled = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('anaji_scheduled_sms')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scheduled SMS deleted successfully.",
      });

      await loadScheduledSMS();
    } catch (error) {
      console.error('Error deleting scheduled SMS:', error)
      toast({
        title: "Error",
        description: "Failed to delete scheduled SMS. Please try again.",
        variant: "destructive"
      })
    }
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.recipient_type === typeFilter
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

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to delete.",
        variant: "destructive"
      })
      return
    }

    try {
      // First delete related delivery reports
      const { error: reportsError } = await supabase
        .from('anaji_sms_delivery_reports')
        .delete()
        .in('campaign_id', selectedItems)

      if (reportsError) throw reportsError

      // Then delete the campaigns
      const { error: campaignsError } = await supabase
        .from('anaji_sms_campaigns')
        .delete()
        .in('id', selectedItems)

      if (campaignsError) throw campaignsError

      toast({
        title: "Success",
        description: `Successfully deleted ${selectedItems.length} campaign${selectedItems.length > 1 ? 's' : ''}.`,
      })

      // Clear selection and reload data
      setSelectedItems([])
      await loadHistory()
    } catch (error) {
      console.error('Error deleting campaigns:', error)
      toast({
        title: "Error",
        description: "Failed to delete selected campaigns. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSingle = async (itemId: string) => {
    try {
      // First delete related delivery reports
      const { error: reportsError } = await supabase
        .from('anaji_sms_delivery_reports')
        .delete()
        .eq('campaign_id', itemId)

      if (reportsError) throw reportsError

      // Then delete the campaign
      const { error: campaignError } = await supabase
        .from('anaji_sms_campaigns')
        .delete()
        .eq('id', itemId)

      if (campaignError) throw campaignError

      toast({
        title: "Success",
        description: "Campaign deleted successfully.",
      })

      // Reload data
      await loadHistory()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive"
      })
    }
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
    sent: history.reduce((sum, item) => sum + item.delivered_count, 0),
    failed: history.reduce((sum, item) => sum + item.failed_count, 0),
    cost: history.reduce((sum, item) => sum + item.cost, 0)
  }

  const scheduledCount = scheduledSMS.filter(s => s.status === 'scheduled').length;

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="history">
            <HistoryIcon className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled ({scheduledCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading SMS history...
                  </TableCell>
                </TableRow>
              ) : filteredHistory.map((item) => (
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
                      <p className="font-medium">{item.recipient_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.recipient_type}
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
                      <p className="text-sm">{new Date(item.sent_date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{item.sent_time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-sm font-medium">{item.delivered_count}</span>
                      </div>
                      {item.failed_count > 0 && (
                        <div className="flex items-center space-x-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span className="text-sm">{item.failed_count}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        of {item.recipient_count}
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
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="shadow-elegant">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledSMS.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Scheduled Messages</h3>
                        <p className="text-muted-foreground">
                          Schedule SMS from the Compose page to see them here
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    scheduledSMS.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.campaign_name}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">
                            {item.message.length > 50 ? `${item.message.substring(0, 50)}...` : item.message}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {item.message.length} chars
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{item.recipient_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {item.recipient_count} recipients
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(item.scheduled_date), 'PPP')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{item.scheduled_time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === 'scheduled' ? 'default' :
                              item.status === 'sent' ? 'secondary' :
                              item.status === 'cancelled' ? 'outline' :
                              'destructive'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {item.status === 'scheduled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelScheduled(item.id)}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteScheduled(item.id)}
                              className="text-destructive hover:text-destructive"
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
        </TabsContent>
      </Tabs>

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
                      <p className="mt-1 font-medium">{item.recipient_name}</p>
                      <Badge variant="outline" className="mt-1">
                        {item.recipient_type}
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
                      <p className="mt-1 text-lg font-bold text-success">{item.delivered_count}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Failed</Label>
                      <p className="mt-1 text-lg font-bold text-destructive">{item.failed_count}</p>
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