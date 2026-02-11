"use client";

import React, { useState } from "react"
import NavigationSidebar from "@/components/navigation-sidebar"
import AnimatedTechBackground from "@/components/animated-tech-background"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Brain,
  Palette,
  BookOpen,
  Shield,
  Bell,
  Plug,
  CreditCard,
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Star,
  Zap,
  Globe,
  Clock,
  FileText,
  Camera,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Laptop,
  Database,
  Key,
  UserPlus,
  Cloud,
  Github,
  Chrome,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Crown,
  Sparkles,
  Plus,
  X
} from "lucide-react"

import { useSettings } from "@/app/context/SettingsContext"
import { useUser } from "@/app/context/UserContext"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account")
  
  // Use Context
  // Use Context
  const { settings, updateSettings } = useSettings();
  const { user, updateUser } = useUser();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  
  // Destructure for easier usage map to existing code references
  const { notifications, privacy, ai, interface: interfaceSettings } = settings;

  const handleSaveProfile = () => {
    // In a real app, this would be an API call
    toast({
      title: "Settings saved",
      description: "Your profile information has been updated successfully.",
    })
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Appearance set to ${newTheme} mode.`,
    })
  }

  const handleConnectService = (serviceName: string, connected: boolean) => {
    toast({
      title: connected ? "Service disconnected" : "Service connected",
      description: `${serviceName} has been ${connected ? "disconnected" : "connected successfully"}.`,
      variant: connected ? "default" : "default" // could be destructive for disconnect
    })
    // Here we would ideally update some local state to reflect the toggle
  }

  const settingsCategories = [
    {
      id: "account",
      label: "Account & Profile",
      icon: User,
      description: "Manage your personal information and preferences"
    },
    {
      id: "ai",
      label: "AI & Models",
      icon: Brain,
      description: "Configure AI models and research preferences"
    },
    {
      id: "interface",
      label: "Interface & Themes",
      icon: Palette,
      description: "Customize your workspace appearance"
    },
    {
      id: "research",
      label: "Research & Workflow",
      icon: BookOpen,
      description: "Set up your research workflow and tools"
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: Shield,
      description: "Control your data and security settings"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage how you receive updates"
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Plug,
      description: "Connect external services and tools"
    },
    {
      id: "billing",
      label: "Billing & Usage",
      icon: CreditCard,
      description: "Subscription and usage information"
    },
    {
      id: "advanced",
      label: "Advanced",
      icon: SettingsIcon,
      description: "Export data and advanced settings"
    }
  ]

  return (
    <div className="layout-container bg-gradient-to-br from-blue-100 via-blue-50 to-sky-50/30 dark:from-slate-950 dark:via-blue-950/40 dark:to-blue-900/20 relative">
      <AnimatedTechBackground variant="grid" />
      {/* Navigation Sidebar */}
      <NavigationSidebar />

      <main className="layout-main">
        {/* Header */}
        <header className="layout-header sticky top-0 z-sticky border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account and research preferences</p>
              </div>
            </div>
          </div>
        </header>

        <div className="layout-content container mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <div>
            <Card className="card-default sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {settingsCategories.map((category) => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeTab === category.id
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm leading-snug">{category.label}</div>
                          <div className="text-xs opacity-70 mt-0.5 line-clamp-2">{category.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div>
            <div className="space-y-6">

              {/* Account & Profile */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold ring-4 ring-primary/20">
                             {user?.firstName?.[0]}{user?.lastName?.[0] || user?.email?.[0] || "U"}
                          </div>
                          <button className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors shadow-lg border-2 border-background">
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input 
                                id="firstName" 
                                placeholder="First Name" 
                                value={user?.firstName || ''}
                                onChange={(e) => updateUser({ firstName: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input 
                                id="lastName" 
                                placeholder="Last Name" 
                                value={user?.lastName || ''}
                                onChange={(e) => updateUser({ lastName: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="Email Address" 
                              value={user?.email || ''}
                              onChange={(e) => updateUser({ email: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="institution">Institution/Organization</Label>
                          <Input 
                            id="institution" 
                            placeholder="University or Company" 
                            value={user?.institution || ''}
                            onChange={(e) => updateUser({ institution: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea 
                            id="bio" 
                            placeholder="Tell us about your research interests..." 
                            className="h-24 resize-none" 
                            value={user?.bio || ''}
                            onChange={(e) => updateUser({ bio: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="role">Current Role</Label>
                            <Input 
                                id="role" 
                                placeholder="PhD Candidate, Professor, etc." 
                                value={user?.role || ''}
                                onChange={(e) => updateUser({ role: e.target.value })}
                              />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                             <Input 
                                id="location" 
                                placeholder="City, Country" 
                                value={user?.location || ''}
                                onChange={(e) => updateUser({ location: e.target.value })}
                              />
                          </div>
                        </div>
                        </div>
                        
                        <div>
                          <Label>Research Interests</Label>
                          <div className="flex flex-wrap gap-2 mb-3 mt-2">
                             {user?.researchInterests?.map((interest, index) => (
                                <Badge key={index} variant="secondary" className="px-2 py-1 gap-1">
                                  {interest}
                                  <span 
                                    className="cursor-pointer hover:text-destructive"
                                    onClick={() => {
                                      const newInterests = user.researchInterests?.filter((_, i) => i !== index);
                                      updateUser({ researchInterests: newInterests });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </span>
                                </Badge>
                             ))}
                          </div>
                          <div className="flex gap-2">
                             <Input 
                               placeholder="Add a research interest (e.g. Neuroscience)" 
                               onKeyDown={(e) => {
                                 if(e.key === 'Enter') {
                                   const val = e.currentTarget.value.trim();
                                   if(val) {
                                      const current = user?.researchInterests || [];
                                      if(!current.includes(val)) {
                                         updateUser({ researchInterests: [...current, val] });
                                         e.currentTarget.value = '';
                                      }
                                   }
                                 }
                               }}
                             />
                             <Button variant="outline" size="icon" onClick={(e) => {
                                 // Need reference to input if using button, or just rely on Enter. 
                                 // For simplicity without refs here, just relying on Enter or could add Ref. Used basic enter approach for now inside Input.
                             }}>
                                <Plus className="h-4 w-4" />
                             </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Press Enter to add tags</p>
                        </div>


                      <div className="flex justify-end pt-4">
                        <Button className="btn-primary" onClick={handleSaveProfile}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Subscription Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-6 w-6 text-warning" />
                          <div>
                            <div className="font-semibold">RaceAI Pro</div>
                            <div className="text-sm text-muted-foreground">Advanced research capabilities</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI & Models */}
              {activeTab === "ai" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Default AI Models
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Default Chat Model</Label>
                          <Select defaultValue="gpt-4o">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="claude-3">Claude 3</SelectItem>
                              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Research Analysis Model</Label>
                          <Select defaultValue="claude-3">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3">Claude 3</SelectItem>
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Custom Instructions</Label>
                        <Textarea
                          placeholder="Add custom instructions for AI responses..."
                          className="h-32"
                          defaultValue="Please provide detailed, research-focused responses with citations when possible. Prioritize accuracy and scientific rigor."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-save Conversations</Label>
                            <p className="text-sm text-muted-foreground">Automatically save all AI conversations</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enhanced Context Memory</Label>
                            <p className="text-sm text-muted-foreground">Allow AI to remember context across sessions</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Research Mode</Label>
                            <p className="text-sm text-muted-foreground">Optimize responses for research workflows</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Interface & Themes */}
              {activeTab === "interface" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Appearance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                              onClick={() => handleThemeChange('dark')}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Moon className="h-4 w-4" />
                              <span className="font-medium">Dark</span>
                            </div>
                            <div className="h-8 bg-slate-950 rounded border border-white/10"></div>
                          </div>
                          <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                              onClick={() => handleThemeChange('light')}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sun className="h-4 w-4" />
                              <span className="font-medium">Light</span>
                            </div>
                            <div className="h-8 bg-white border border-slate-200 rounded"></div>
                          </div>
                          <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                              onClick={() => handleThemeChange('system')}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Monitor className="h-4 w-4" />
                              <span className="font-medium">System</span>
                            </div>
                            <div className="h-8 bg-gradient-to-r from-slate-900 to-white rounded border border-border"></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Compact Mode</Label>
                            <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Grid Background</Label>
                            <p className="text-sm text-muted-foreground">Display subtle grid pattern</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Sidebar Auto-collapse</Label>
                            <p className="text-sm text-muted-foreground">Auto-hide sidebar on small screens</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <div>
                        <Label>Font Size</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Research & Workflow */}
              {activeTab === "research" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Research Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Default Citation Style</Label>
                          <Select defaultValue="apa">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apa">APA 7th Edition</SelectItem>
                              <SelectItem value="mla">MLA 9th Edition</SelectItem>
                              <SelectItem value="chicago">Chicago 17th Edition</SelectItem>
                              <SelectItem value="ieee">IEEE</SelectItem>
                              <SelectItem value="nature">Nature</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Export Format</Label>
                          <Select defaultValue="pdf">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="docx">Word Document</SelectItem>
                              <SelectItem value="md">Markdown</SelectItem>
                              <SelectItem value="latex">LaTeX</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-generate Summaries</Label>
                            <p className="text-sm text-muted-foreground">Create summaries for research sessions</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Track Research Time</Label>
                            <p className="text-sm text-muted-foreground">Monitor time spent on projects</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Smart Categorization</Label>
                            <p className="text-sm text-muted-foreground">Auto-categorize research by topic</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <div>
                        <Label>Default Project Template</Label>
                        <Select defaultValue="academic">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic">Academic Research</SelectItem>
                            <SelectItem value="industry">Industry Analysis</SelectItem>
                            <SelectItem value="literature">Literature Review</SelectItem>
                            <SelectItem value="experiment">Experimental Design</SelectItem>
                            <SelectItem value="custom">Custom Template</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Privacy & Security */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Public Profile</Label>
                          <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
                        </div>
                        <Switch
                          checked={privacy.profileVisible}
                          onCheckedChange={(checked) => updateSettings('privacy', { profileVisible: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Share Research Publicly</Label>
                          <p className="text-sm text-muted-foreground">Allow others to discover your research</p>
                        </div>
                        <Switch
                          checked={privacy.researchVisible}
                          onCheckedChange={(checked) => updateSettings('privacy', { researchVisible: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Default Sharing</Label>
                          <p className="text-sm text-muted-foreground">Share new projects by default</p>
                        </div>
                        <Switch
                          checked={privacy.shareByDefault}
                          onCheckedChange={(checked) => updateSettings('privacy', { shareByDefault: checked })}
                        />
                      </div>

                      <div>
                        <Label>Data Retention</Label>
                        <Select value={privacy.dataRetention} onValueChange={(value) => updateSettings('privacy', { dataRetention: value })}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30-days">30 Days</SelectItem>
                            <SelectItem value="90-days">90 Days</SelectItem>
                            <SelectItem value="1-year">1 Year</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Email Notifications</Label>
                              <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.email}
                            onCheckedChange={(checked) => updateSettings('notifications', { email: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Push Notifications</Label>
                              <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.push}
                            onCheckedChange={(checked) => updateSettings('notifications', { push: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Research Updates</Label>
                              <p className="text-sm text-muted-foreground">Notifications about your research progress</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.research}
                            onCheckedChange={(checked) => updateSettings('notifications', { research: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Collaboration Invites</Label>
                              <p className="text-sm text-muted-foreground">When someone invites you to collaborate</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.collaborations}
                            onCheckedChange={(checked) => updateSettings('notifications', { collaborations: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Product Updates</Label>
                              <p className="text-sm text-muted-foreground">New features and improvements</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications.updates}
                            onCheckedChange={(checked) => updateSettings('notifications', { updates: checked })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Notification Frequency</Label>
                        <Select defaultValue="immediate">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Summary</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Integrations */}
              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plug className="h-5 w-5" />
                        Connected Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "Google Scholar", icon: Globe, connected: true, description: "Search and import academic papers" },
                        { name: "Zotero", icon: BookOpen, connected: false, description: "Reference management" },
                        { name: "GitHub", icon: Github, connected: true, description: "Code repository integration" },
                        { name: "Notion", icon: FileText, connected: false, description: "Note-taking and documentation" },
                        { name: "Slack", icon: UserPlus, connected: false, description: "Team collaboration" },
                        { name: "Google Drive", icon: Cloud, connected: true, description: "File storage and sharing" }
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <service.icon className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">{service.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {service.connected && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                            <button 
                                className={service.connected ? "btn-secondary text-xs px-3 py-1" : "btn-primary text-xs px-3 py-1"}
                                onClick={() => handleConnectService(service.name, service.connected)}
                            >
                              {service.connected ? "Disconnect" : "Connect"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Billing & Usage */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription & Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Crown className="h-6 w-6 text-yellow-500" />
                            <div>
                              <div className="font-semibold">RaceAI Pro</div>
                              <div className="text-sm text-muted-foreground">$29/month</div>
                            </div>
                          </div>
                          <Badge className="bg-primary/10 text-primary">
                            Active
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Next billing date: November 28, 2024
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-secondary px-3 py-1 text-sm">Change Plan</button>
                          <button className="btn-secondary px-3 py-1 text-sm">Cancel Subscription</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">24,891</div>
                            <div className="text-sm text-muted-foreground">AI Interactions</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-success" />
                            <div className="text-2xl font-bold">156</div>
                            <div className="text-sm text-muted-foreground">Research Projects</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">89h</div>
                            <div className="text-sm text-muted-foreground">Research Time</div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Advanced */}
              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Data Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <button className="btn-secondary w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </button>
                      <button className="btn-secondary w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </button>
                      <button className="btn-secondary w-full justify-start">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </button>
                      <Separator />
                      <button className="bg-error text-white hover:bg-error/90 w-full justify-start p-3 rounded-lg transition-fast flex items-center">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    </CardContent>
                  </Card>

                  <Card className="card-default card-dual-light">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Developer Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>API Access</Label>
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="API Key" type="password" value="sk-..." />
                          <Button variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Debug Mode</Label>
                          <p className="text-sm text-muted-foreground">Enable debugging information</p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}