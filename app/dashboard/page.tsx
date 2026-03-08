"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Settings,
  User,
  BookOpen,
  TrendingUp,
  Users,
  Star,
  Plus,
  Filter,
  Calendar,
  Clock,
  Brain,
  Target,
  BarChart3,
  Zap,
} from "lucide-react"
import ModernLogo from "@/components/modern-logo"
import NavigationSidebar from "@/components/navigation-sidebar"
import GeometricBackground from "@/components/geometric-background"

// NEW FEATURES - Import widgets (won't affect existing design)
import { NotificationCenter } from "@/components/notification-center"
import { ActivityFeed } from "@/components/activity-feed"
import { StreakTracker } from "@/components/streak-tracker"
import { TodaysFocus } from "@/components/todays-focus"

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string; size?: number }>
  title: string
  value: string
  change: string
  trend: "up" | "down"
}

const StatsCard = ({ icon: Icon, title, value, change, trend }: StatsCardProps) => (
  <div className="p-5 bg-background border border-border hover:border-primary transition-all rounded-lg">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
        <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
        <div
          className={`flex items-center text-xs font-medium ${trend === "up" ? "text-success" : "text-error"
            }`}
        >
          <TrendingUp size={12} className={trend === "down" ? "rotate-180" : ""} />
          <span className="ml-1">{change}</span>
        </div>
      </div>
      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  </div>
)

interface PaperCardProps {
  title: string
  authors: string
  journal: string
  date: string
  status: "completed" | "in-progress" | "saved"
  progress?: number
}

const PaperCard = ({ title, authors, journal, date, status, progress }: PaperCardProps) => (
  <div className="p-4 border border-border hover:border-primary hover:bg-accent/50 transition-all rounded-lg">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 pr-4">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-1">{authors}</p>
        <p className="text-xs text-muted-foreground">
          {journal} • {date}
        </p>
      </div>
      <div
        className={`px-3 py-1 text-xs font-medium rounded-lg ${status === "completed"
          ? "bg-success/10 text-success"
          : status === "in-progress"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
          }`}
      >
        {status}
      </div>
    </div>

    {progress && (
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-lg">
          <div
            className="bg-primary h-2 rounded-lg transition-normal"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}

    <div className="flex gap-3">
      <button className="flex-1 py-2.5 px-4 btn-primary text-sm font-medium">
        Continue Reading
      </button>
      <button className="py-2.5 px-3 btn-ghost">
        <Star size={16} />
      </button>
    </div>
  </div>
)

interface TaskItemProps {
  title: string
  type: string
  dueDate: string
  priority: "high" | "medium" | "low"
}

const TaskItem = ({ title, type, dueDate, priority }: TaskItemProps) => (
  <div className="flex items-center gap-4 p-4 bg-background border border-border hover:border-primary hover:bg-accent/50 transition-all rounded-lg">
    <div
      className={`w-3 h-3 rounded-full ${priority === "high" ? "bg-error" : priority === "medium" ? "bg-warning" : "bg-success"
        }`}
    />
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">
        {type} • Due {dueDate}
      </p>
    </div>
    <Clock className="w-4 h-4 text-muted-foreground" />
  </div>
)

export default function Dashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [userData] = useState({
    name: "Meghana",
    role: "Researcher",
    institution: "USC",
    researchFocus: "Machine Learning",
    completedOnboarding: true,
  })
  const [savedPapers, setSavedPapers] = useState<any[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]")
    setSavedPapers(saved)
  }, [])

  return (
    <div className="min-h-screen flex relative">
      <div className="dark:hidden">
        <GeometricBackground variant="torus" />
      </div>
      <NavigationSidebar />
      <div className="flex-1">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <ModernLogo size={32} showText={false} />
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    RACE.AI
                  </h1>
                  <p className="text-xs text-muted-foreground">Research Dashboard</p>
                </div>
              </div>

              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <div className="flex items-center card-default focus-within:border-primary">
                    <Search className="w-4 h-4 text-muted-foreground ml-4 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search papers, topics, or authors..."
                      className="flex-1 py-3 pl-3 pr-4 bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* NEW: Replace static bell with functional NotificationCenter */}
                <NotificationCenter />
                <button className="btn-ghost p-2.5">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-3">Welcome back, {userData.name}!</h2>
            <p className="text-muted-foreground text-base">
              Here's your research progress and what's happening today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard icon={BookOpen} title="Papers Read" value="47" change="+12% this week" trend="up" />
            <StatsCard icon={Target} title="Research Goals" value="8/12" change="3 completed" trend="up" />
            <StatsCard icon={Users} title="Collaborations" value="5" change="2 new invites" trend="up" />
            <StatsCard icon={BarChart3} title="Citations" value="324" change="+8% this month" trend="up" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Papers */}
            <div className="lg:col-span-2 space-y-6">
              {/* NEW: Today's Focus - Daily task prioritization */}
              <TodaysFocus />

              <div className="bg-background p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold text-foreground">Recent Papers</h3>
                  <div className="flex items-center gap-3">
                    <button className="btn-ghost p-2">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button
                      className="btn-primary px-4 py-2 animate-paper"
                      onClick={() => router.push('/knowledge?action=upload')}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Paper
                    </button>
                  </div>
                </div>

                {/* SAVED PAPERS SECTION */}
                {savedPapers.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Saved Library</h4>
                    <div className="space-y-3">
                      {savedPapers.map((paper, idx) => (
                        <PaperCard
                          key={paper.id || idx}
                          title={paper.title}
                          authors={paper.author || "Unknown Author"}
                          journal={paper.category || "Research"}
                          date={paper.date || "2024"}
                          status="saved"
                          progress={0}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <PaperCard
                    title="Neural Architecture Search for Transformer Models in Natural Language Processing"
                    authors="Smith, J. et al."
                    journal="Nature Machine Intelligence"
                    date="2024"
                    status="in-progress"
                    progress={65}
                  />
                  <PaperCard
                    title="Attention Mechanisms in Computer Vision: A Comprehensive Survey"
                    authors="Johnson, A. & Brown, M."
                    journal="IEEE TPAMI"
                    date="2024"
                    status="completed"
                    progress={100}
                  />
                  <PaperCard
                    title="Federated Learning with Differential Privacy in Healthcare Applications"
                    authors="Davis, K. et al."
                    journal="JMIR Med Inform"
                    date="2024"
                    status="saved"
                    progress={0}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* NEW: Streak Tracker - Gamification widget */}
              <StreakTracker />

              {/* Tasks */}
              <div className="bg-background p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-foreground">Today's Tasks</h3>
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <TaskItem title="Review Chapter 3 Draft" type="Writing" dueDate="Today" priority="high" />
                  <TaskItem title="Data Analysis Meeting" type="Meeting" dueDate="2:00 PM" priority="medium" />
                  <TaskItem title="Submit Conference Paper" type="Submission" dueDate="Tomorrow" priority="high" />
                </div>
              </div>

              {/* JARVIS Assistant */}
              <div className="bg-background p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground">JARVIS Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <p className="text-primary font-medium text-sm">New papers in your field</p>
                    </div>
                    <p className="text-primary/80 text-xs">
                      3 papers on neural architecture search published this week
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-success" />
                      <p className="text-success font-medium text-sm">
                        Collaboration opportunity
                      </p>
                    </div>
                    <p className="text-success/80 text-xs">
                      Dr. Smith wants to collaborate on transformer research
                    </p>
                  </div>
                </div>
              </div>

              {/* NEW: Activity Feed - Shows recent team activity */}
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}