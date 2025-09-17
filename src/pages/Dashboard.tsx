import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, UserCheck, Calendar, Send, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import churchHero from "@/assets/church-hero.jpg"
import { supabase } from "@/integrations/supabase/client"

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      title: "Total Members",
      value: "0",
      icon: UserCheck,
      description: "Active members",
      color: "text-blue-600"
    },
    {
      title: "SMS Sent Today",
      value: "0",
      icon: Send,
      description: "Messages today",
      color: "text-green-600"
    },
    {
      title: "Active Groups",
      value: "0",
      icon: Users,
      description: "Ministry groups",
      color: "text-purple-600"
    },
    {
      title: "This Month",
      value: "0",
      icon: TrendingUp,
      description: "Total SMS sent",
      color: "text-orange-600"
    }
  ])

  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    loadDashboardStats()
    loadRecentActivity()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Get member count from nana_profiles
      const { count: memberCount } = await supabase
        .from('nana_profiles')
        .select('*', { count: 'exact', head: true })

      // Get group count from nana_categories
      const { count: groupCount } = await supabase
        .from('nana_categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats([
        {
          title: "Total Members",
          value: memberCount?.toString() || "0",
          icon: UserCheck,
          description: "Active members",
          color: "text-blue-600"
        },
        {
          title: "SMS Sent Today",
          value: "0",
          icon: Send,
          description: "Messages today",
          color: "text-green-600"
        },
        {
          title: "Active Groups",
          value: groupCount?.toString() || "0",
          icon: Users,
          description: "Ministry groups",
          color: "text-purple-600"
        },
        {
          title: "This Month",
          value: "0",
          icon: TrendingUp,
          description: "Total SMS sent",
          color: "text-orange-600"
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Get recent member additions for now
      const { data: recentMembers } = await supabase
        .from('nana_profiles')
        .select('first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      const formattedActivity = (recentMembers || []).map(member => ({
        title: "New Member Added",
        description: `${member.first_name} ${member.last_name} joined the system`,
        time: formatRelativeTime(member.created_at)
      }))

      setRecentActivity(formattedActivity)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const quickActions = [
    {
      title: "Send Quick SMS",
      description: "Compose and send SMS to members",
      icon: MessageSquare,
      href: "/compose",
      variant: "default" as const
    },
    {
      title: "Mark Attendance",
      description: "Create attendance session",
      icon: Calendar,
      href: "/attendance",
      variant: "secondary" as const
    },
    {
      title: "Manage Members",
      description: "Add or edit member details",
      icon: UserCheck,
      href: "/members",
      variant: "outline" as const
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-primary text-white">
        <div className="absolute inset-0 bg-black/20" />
        <img 
          src={churchHero} 
          alt="Church community"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to Church Of Pentecost
          </h1>
          <p className="text-xl text-white/90 mb-6 max-w-2xl">
            Anaji English Assembly SMS Management System
          </p>
          <p className="text-white/80 max-w-xl">
            Stay connected with your congregation through our comprehensive SMS platform. 
            Send messages, manage members, track attendance, and build stronger community bonds.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.title} className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{action.description}</p>
                <Button asChild variant={action.variant} className="w-full">
                  <Link to={action.href}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground">Your recent SMS activity will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard