import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Users, Phone, MessageSquare, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export default function Compose() {
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('groups');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    fetchAllMembers();
  }, []);

  const fetchAllMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_members')
        .select('id, name, phone, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      const formattedMembers = (data || []).map(member => ({
        id: member.id,
        first_name: member.name.split(' ')[0] || '',
        last_name: member.name.split(' ').slice(1).join(' ') || '',
        phone_number: member.phone
      }));

      setAllMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching all members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('id, name, description, member_count')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    }
  };

  const fetchGroupMembers = async (groupIds: string[]) => {
    if (groupIds.length === 0) {
      setMembers([]);
      return;
    }

    try {
      // Step 1: Get member IDs in the selected groups
      const { data: linkRows, error: linkError } = await supabase
        .from('anaji_member_groups')
        .select('member_id')
        .in('group_id', groupIds);

      if (linkError) throw linkError;

      const memberIds = Array.from(new Set((linkRows || []).map((r: any) => r.member_id))).filter(Boolean);

      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      // Step 2: Fetch active members by those IDs
      const { data: memberRows, error: membersError } = await supabase
        .from('anaji_members')
        .select('id, name, phone, status')
        .in('id', memberIds)
        .eq('status', 'active')
        .order('name');

      if (membersError) throw membersError;

      const formattedMembers = (memberRows || []).map((member: any) => ({
        id: member.id,
        first_name: member.name.split(' ')[0] || '',
        last_name: member.name.split(' ').slice(1).join(' ') || '',
        phone_number: member.phone
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (selectedGroups.length > 0) {
      fetchGroupMembers(selectedGroups);
    } else {
      setMembers([]);
    }
  }, [selectedGroups]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getRecipientCount = () => {
    if (activeTab === 'groups') {
      return members.length;
    } else {
      // Count selected members plus manually entered phone numbers
      const manualPhones = manualRecipients
        .split(/[,\n]/)
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);
      return selectedMembers.length + manualPhones.length;
    }
  };

  const getEstimatedCost = () => {
    const recipientCount = getRecipientCount();
    const messageLength = message.length;
    const smsCount = Math.ceil(messageLength / 160);
    const costPerSMS = 0.05; // $0.05 per SMS
    return (recipientCount * smsCount * costPerSMS).toFixed(2);
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }

    const recipientCount = getRecipientCount();
    if (recipientCount === 0) {
      toast({
        title: 'Error',
        description: 'Please select recipients',
        variant: 'destructive',
      });
      return;
    }

    if (isScheduled) {
      if (!scheduledDate) {
        toast({
          title: 'Error',
          description: 'Please select a scheduled date',
          variant: 'destructive',
        });
        return;
      }
      if (!scheduledTime) {
        toast({
          title: 'Error',
          description: 'Please select a scheduled time',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSending(true);

    try {
      let recipients: string[] = [];
      let recipientName = '';
      let recipientType: 'group' | 'manual' | 'single' = 'manual';

      if (activeTab === 'groups') {
        recipientType = 'group';
        recipients = members.map(member => member.phone_number);
        recipientName = selectedGroups.length === 1 
          ? groups.find(g => g.id === selectedGroups[0])?.name || 'Unknown Group'
          : `${selectedGroups.length} Groups`;
      } else {
        // Combine selected members and manual phone numbers
        const selectedMemberPhones = allMembers
          .filter(m => selectedMembers.includes(m.id))
          .map(m => m.phone_number);
        
        const manualPhones = manualRecipients
          .split(/[,\n]/)
          .map(phone => phone.trim())
          .filter(phone => phone.length > 0);
        
        recipients = [...selectedMemberPhones, ...manualPhones];
        recipientType = recipients.length === 1 ? 'single' : 'manual';
        recipientName = recipientType === 'single' ? recipients[0] : 'Manual Recipients';
      }

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      if (recipients.length > 100) {
        throw new Error('Maximum 100 recipients allowed per campaign');
      }

      if (isScheduled && scheduledDate && scheduledTime) {
        const { error } = await supabase
          .from('anaji_scheduled_sms')
          .insert({
            campaign_name: `Scheduled SMS - ${format(scheduledDate, 'PPP')} ${scheduledTime}`,
            message: message.trim(),
            recipients,
            recipient_type: recipientType,
            recipient_name: recipientName,
            recipient_count: recipients.length,
            group_id: activeTab === 'groups' && selectedGroups.length === 1 ? selectedGroups[0] : null,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            scheduled_time: scheduledTime,
            status: 'scheduled',
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: `SMS scheduled successfully for ${format(scheduledDate, 'PPP')} at ${scheduledTime}`,
        });

        setMessage('');
        setSelectedGroups([]);
        setSelectedMembers([]);
        setManualRecipients('');
        setMembers([]);
        setIsScheduled(false);
        setScheduledDate(undefined);
        setScheduledTime('');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignName: `SMS Campaign - ${new Date().toLocaleString()}`,
          message: message.trim(), 
          recipients,
          recipientType,
          recipientName,
          groupId: activeTab === 'groups' && selectedGroups.length === 1 ? selectedGroups[0] : null
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'SMS sending failed');
      }

      toast({
        title: 'Success',
        description: `SMS sent successfully! ${data.delivered} delivered, ${data.failed} failed.`,
      });

      setMessage('');
      setSelectedGroups([]);
      setSelectedMembers([]);
      setManualRecipients('');
      setMembers([]);
      setIsScheduled(false);
      setScheduledDate(undefined);
      setScheduledTime('');

    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Compose SMS
        </h1>
        <p className="text-muted-foreground mt-2">
          Send SMS messages to groups or individual recipients
        </p>
      </div>

      <div className="grid gap-6">
        {/* Message Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Compose your SMS message (160 characters per SMS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{message.length} characters</span>
                  <span>{Math.ceil(message.length / 160)} SMS</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                  />
                  <Label htmlFor="schedule" className="cursor-pointer font-medium">
                    Schedule for later
                  </Label>
                </div>

                {isScheduled && (
                  <div className="space-y-4 pl-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal h-10',
                                !scheduledDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Select Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                          <Input
                            id="time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="pl-10 h-10"
                            required={isScheduled}
                          />
                        </div>
                      </div>
                    </div>

                    {scheduledDate && scheduledTime && (
                      <div className="bg-muted/50 p-3 rounded-lg border">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Scheduled for: {format(scheduledDate, 'PPP')} at {scheduledTime}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>
              Choose recipients for your SMS message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groups
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="groups" className="space-y-4">
                <div>
                  <Label className="mb-2 block">Select Groups</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="h-64 overflow-y-auto p-3 space-y-2">
                      {groups.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No groups available
                        </p>
                      ) : (
                        groups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              id={group.id}
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={() => handleGroupToggle(group.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={group.id} className="font-medium cursor-pointer truncate block">
                                {group.name}
                              </Label>
                              {group.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {group.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {group.member_count} members
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {selectedGroups.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selected Recipients Preview</h4>
                    <div className="border rounded-md overflow-hidden bg-background">
                      <div className="h-32 overflow-y-auto p-3 space-y-1">
                        {members.slice(0, 3).map((member) => (
                          <div key={member.id} className="text-sm p-2 rounded bg-muted/50">
                            {member.first_name} {member.last_name} - {member.phone_number}
                          </div>
                        ))}
                        {members.length > 3 && (
                          <div className="text-sm p-2 text-muted-foreground italic">
                            ... and {members.length - 3} more (scroll to see all)
                          </div>
                        )}
                        {members.slice(3).map((member) => (
                          <div key={member.id} className="text-sm p-2 rounded bg-muted/50">
                            {member.first_name} {member.last_name} - {member.phone_number}
                          </div>
                        ))}
                        {members.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Loading members...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Total: {members.length} members from {selectedGroups.length} group(s)
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Select Members</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-64 overflow-y-auto p-3 space-y-2">
                        {allMembers.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No members available
                          </p>
                        ) : (
                          allMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded"
                            >
                              <Checkbox
                                id={`member-${member.id}`}
                                checked={selectedMembers.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMembers([...selectedMembers, member.id]);
                                  } else {
                                    setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={`member-${member.id}`} className="cursor-pointer font-normal truncate block">
                                  {member.first_name} {member.last_name}
                                </Label>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.phone_number}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedMembers.length} member(s) selected
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or enter phone numbers manually
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="manual-recipients">Phone Numbers</Label>
                    <Textarea
                      id="manual-recipients"
                      placeholder="Enter phone numbers separated by commas or new lines&#10;e.g., +233501234567, +233241234567"
                      value={manualRecipients}
                      onChange={(e) => setManualRecipients(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium">
                      Total recipients: {getRecipientCount()}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Send Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Send Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recipients:</span>
                  <span className="ml-2 font-medium">{getRecipientCount()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SMS Count:</span>
                  <span className="ml-2 font-medium">
                    {Math.ceil(message.length / 160) * getRecipientCount()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Cost:</span>
                  <span className="ml-2 font-medium">${getEstimatedCost()}</span>
                </div>
              </div>

              <Button
                onClick={handleSendSMS}
                disabled={isSending || !message.trim() || getRecipientCount() === 0}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isScheduled ? 'Scheduling SMS...' : 'Sending SMS...'}
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule SMS for {getRecipientCount()} Recipients
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send SMS to {getRecipientCount()} Recipients
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}