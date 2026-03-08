"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import ARIAAssistant, { useARIAConversation } from "@/components/aria-assistant"
import { cn } from "@/lib/utils"
import GeometricBackground from "@/components/geometric-background"
import {
  BookOpen,
  Users,
  BarChart3,
  Search,
  FileText,
  Target,
  Lightbulb,
  Calendar,
  MessageSquare,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface UserProfile {
  email: string
  name: string
  role: string
  level: string
  authenticated: boolean
  onboarded: boolean
}

const getPersonalizedContent = (role: string, level: string) => {
  const isPhD = level === "phd"
  const isUndergrad = level === "undergrad"
  const isGraduate = level === "graduate"
  const isProfessor = role === "professor"

  if (isPhD) {
    return {
      welcome: `Welcome to your PhD research command center! I've customized everything for advanced research work.`,
      quickActions: [
        { icon: Search, title: "Literature Search", description: "Find papers in your field", color: "bg-blue-500" },
        { icon: FileText, title: "Thesis Planner", description: "Organize your dissertation", color: "bg-green-500" },
        { icon: BarChart3, title: "Research Analytics", description: "Track your progress", color: "bg-[#0052CC]" },
        { icon: Users, title: "Collaboration Hub", description: "Connect with advisors", color: "bg-orange-500" },
      ],
      suggestions: [
        "Help me plan my literature review methodology",
        "Find recent papers on [your research topic]",
        "Create a timeline for my dissertation chapters",
        "Suggest collaboration opportunities in my field",
      ],
      stats: {
        papers: "1,200+ papers",
        tools: "Advanced research tools",
        network: "PhD community access",
      },
    }
  } else if (isProfessor) {
    return {
      welcome: `Welcome, Professor! Your research and teaching dashboard is ready.`,
      quickActions: [
        { icon: BookOpen, title: "Course Materials", description: "Manage your classes", color: "bg-indigo-500" },
        { icon: Users, title: "Student Mentoring", description: "Track student progress", color: "bg-teal-500" },
        { icon: Search, title: "Research Hub", description: "Latest in your field", color: "bg-blue-500" },
        { icon: BarChart3, title: "Publication Tracker", description: "Monitor your research", color: "bg-red-500" },
      ],
      suggestions: [
        "Help me design a new course curriculum",
        "Find collaboration opportunities with other faculty",
        "Analyze trends in my research field",
        "Create engaging lecture materials",
      ],
      stats: {
        papers: "Full database access",
        tools: "Teaching & research tools",
        network: "Faculty network",
      },
    }
  } else if (isUndergrad) {
    return {
      welcome: `Hey there! I've set up the perfect study environment for your undergraduate journey.`,
      quickActions: [
        { icon: BookOpen, title: "Study Assistant", description: "Get help with coursework", color: "bg-green-500" },
        { icon: Calendar, title: "Assignment Tracker", description: "Never miss a deadline", color: "bg-blue-500" },
        { icon: Users, title: "Study Groups", description: "Find study partners", color: "bg-[#0052CC]" },
        {
          icon: Lightbulb,
          title: "Research Starter",
          description: "Begin your research journey",
          color: "bg-yellow-500",
        },
      ],
      suggestions: [
        "Help me understand this research paper",
        "Find study materials for my courses",
        "Explain complex concepts in simple terms",
        "Help me start my first research project",
      ],
      stats: {
        papers: "Curated undergraduate resources",
        tools: "Study optimization tools",
        network: "Student community",
      },
    }
  } else {
    return {
      welcome: `Welcome to your personalized research environment! Everything is tailored to your ${level} ${role} profile.`,
      quickActions: [
        { icon: Search, title: "Research Hub", description: "Discover relevant papers", color: "bg-blue-500" },
        { icon: Target, title: "Goal Tracker", description: "Monitor research objectives", color: "bg-green-500" },
        { icon: Users, title: "Collaboration", description: "Connect with peers", color: "bg-[#0052CC]" },
        { icon: BarChart3, title: "Progress Analytics", description: "Track your development", color: "bg-orange-500" },
      ],
      suggestions: [
        "Find papers relevant to my research interests",
        "Help me organize my research notes",
        "Suggest networking opportunities",
        "Create a research timeline",
      ],
      stats: {
        papers: "Personalized paper recommendations",
        tools: "Research management tools",
        network: "Academic community",
      },
    }
  }
}

export default function WelcomePage() {
  const router = useRouter()
  const { currentState, currentMessage, speak, celebrate, idle } = useARIAConversation()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [showQuickStart, setShowQuickStart] = useState(true)

  useEffect(() => {
    // Get user profile from localStorage
    const userData = localStorage.getItem("race_ai_user")
    if (userData) {
      const profile = JSON.parse(userData)
      setUserProfile(profile)

      // ARIA welcome message
      setTimeout(() => {
        const content = getPersonalizedContent(profile.role, profile.level)
        celebrate(content.welcome)
      }, 1000)
    } else {
      // Redirect to onboarding if no user data
      router.push("/")
    }
  }, [router, celebrate])

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    )
  }

  const content = getPersonalizedContent(userProfile.role, userProfile.level)

  const handleQuickAction = (action: string) => {
    speak(`Great choice! Let me help you with ${action}. This would normally open the ${action} interface.`)
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    speak(
      `Excellent question! "${chatInput}" - In the full version, I'd provide detailed, personalized assistance based on your ${userProfile.level} ${userProfile.role} profile. For now, let me show you around your dashboard!`,
    )
    setChatInput("")
  }

  const handleGetStarted = () => {
    router.push("/jarvis")
  }

  return (
    <div className="min-h-screen relative">
      <div className="dark:hidden absolute inset-0 z-0 pointer-events-none">
        <GeometricBackground variant="tesseract" />
      </div>
      {/* Header */}
      <div className="border-b border-border/50 glass-card backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to RACE AI</h1>
            <p className="text-muted-foreground">
              {userProfile.name} • {userProfile.level} {userProfile.role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleGetStarted} className="btn-primary shadow-lg hover:shadow-xl transition-all duration-200">
              Enter Full Platform
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Welcome Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* ARIA Welcome */}
            <div className="text-center mb-8">
              <ARIAAssistant
                size="large"
                state={currentState}
                message={currentMessage}
                onMessageComplete={() => idle()}
              />
            </div>

            {/* Quick Actions */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <Card className="relative glass-card border-border/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Personalized Tools
                  </CardTitle>
                  <CardDescription>Everything you need, tailored for your research level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {content.quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.title)}
                        className="p-4 glass-card border border-border/50 hover:border-primary/50 transition-all duration-200 text-left group hover:shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg text-white", action.color)}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Try ARIA Section */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <Card className="relative glass-card border-border/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Chat with ARIA</CardTitle>
                  <CardDescription>Ask me anything about research - I'm here to help!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-foreground">Try asking:</p>
                    {content.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setChatInput(suggestion)}
                        className="text-left text-sm p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        • "{suggestion}"
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask ARIA anything about research..."
                      className="glass-card border-border/50 focus:border-primary/50 transition-all duration-200 flex-1"
                    />
                    <Button type="submit" className="btn-primary shadow-lg hover:shadow-xl transition-all duration-200">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <Card className="relative glass-card border-border/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">Your Research Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Access Level</span>
                      <span className="text-sm font-medium text-foreground capitalize">
                        {userProfile.level} {userProfile.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Database</span>
                      <span className="text-sm font-medium text-primary">{content.stats.papers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tools</span>
                      <span className="text-sm font-medium text-primary">{content.stats.tools}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="text-sm font-medium text-primary">{content.stats.network}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide */}
            {showQuickStart && (
              <Card className="aria-card border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Start</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickStart(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Explore your personalized tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Chat with ARIA for guidance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <span>Enter the full platform when ready</span>
                    </div>
                  </div>
                  <Button onClick={handleGetStarted} className="w-full btn-primary shadow-lg hover:shadow-xl transition-all duration-200 mt-4">
                    Start Your Research Journey
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <Card className="relative glass-card border-border/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Customize Dashboard
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Research Interests
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
