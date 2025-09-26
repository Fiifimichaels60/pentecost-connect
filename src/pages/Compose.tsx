import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Users, Phone, MessageSquare } from 'lucide-react';

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
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('groups');
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('anaji_groups')
        .select('*')
        .eq('is_active', true)
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
      const { data, error } = await supabase
        .from('anaji_members')
        .select('id, name, phone')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (error) throw error;
      
      const formattedMembers = (data || []).map(member => ({
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
      const phones = manualRecipients
        .split(/[,\n]/)
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);
      return phones.length;
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
        recipientType = recipients.length === 1 ? 'single' : 'manual';
        recipients = manualRecipients
          .split(/[,\n]/)
          .map(phone => phone.trim())
          .filter(phone => phone.length > 0);
        recipientName = recipientType === 'single' ? recipients[0] : 'Manual Recipients';
      }

      if (recipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      if (recipients.length > 100) {
        throw new Error('Maximum 100 recipients allowed per campaign');
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

      // Reset form
      setMessage('');
      setSelectedGroups([]);
      setManualRecipients('');
      setMembers([]);

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
                <div className="grid gap-4">
                  {groups.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No groups available
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={group.id} className="font-medium cursor-pointer">
                            {group.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {group.member_count} members
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                {selectedGroups.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selected Recipients:</h4>
                    <div className="text-sm text-muted-foreground">
                      {members.length} members from {selectedGroups.length} group(s)
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label htmlFor="manual-recipients">Phone Numbers</Label>
                  <Textarea
                    id="manual-recipients"
                    placeholder="Enter phone numbers separated by commas or new lines&#10;e.g., +1234567890, +0987654321"
                    value={manualRecipients}
                    onChange={(e) => setManualRecipients(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {getRecipientCount()} recipients
                  </p>
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
                    Sending SMS...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send SMS to {getRecipientCount()} Recipients
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