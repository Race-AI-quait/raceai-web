"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Edit2,
  Save,
  X,
  ExternalLink,
  BookOpen,
  Award,
  MapPin,
  GraduationCap,
  Mail,
  Calendar,
  Plus,
  Camera,
  Github,
  Globe,
  Twitter,
  Linkedin,
  Check,
} from "lucide-react"
import NavigationSidebar from "@/components/navigation-sidebar"
import ModernLogo from "@/components/modern-logo"
import AnimatedTechBackground from "@/components/animated-tech-background"
import { useToast } from "@/components/ui/use-toast"

import { User, useUser } from "../context/UserContext";

interface EditableFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onChange, placeholder, multiline = false, className = "" }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const handleSave = () => {
    onChange(tempValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {multiline ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="flex-1 rounded-lg border-blue-500 focus:ring-blue-500"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
            autoFocus
          />
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="flex-1 rounded-lg border-blue-500 focus:ring-blue-500"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
            autoFocus
          />
        )}
        <Button size="sm" onClick={handleSave} className="btn-primary px-3 py-1">
          <Check size={14} />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="px-3 py-1">
          <X size={14} />
        </Button>
      </div>
    )
  }


  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      <span className="flex-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
        {value || placeholder}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg px-2 py-1"
      >
        <Edit2 size={14} className="text-blue-500" />
      </Button>
    </div>
  )
}

export default function ProfilePage() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageUrl = reader.result as string
        setProfileImage(imageUrl)
        localStorage.setItem('profile_image', imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const savedImage = localStorage.getItem('profile_image')
    if (savedImage) {
      setProfileImage(savedImage)
    }
  }, [])
    const { user, updateUser } = useUser();
  console.log("Inside profile page")
  console.log(user);

  // No need for separate profileData state really if we sync directly with user context? 
  // But let's keep it for controlled inputs if needed, or just derive from user.
  // Actually, syncing back and forth can be tricky.
  // Let's rely on user context as source of truth if possible, or keep local state and sync on change.
  // Given current setup, we have local profileData initialized from user.
  // We should update User context on every change.

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize from user context
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    institution: "",
    department: "",
    role: "",
    bio: "",
    location: "",
    website: "",
    googleScholar: "",
    github: "",
    twitter: "",
    linkedin: "",
    orcid: "",
    researchInterests: [] as string[],
    publications: "",
    citations: "",
    hIndex: "",
    currentProjects: [] as { name: string; status: "Active" | "Planning" | "Completed" }[],
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.firstName || "User Name",
        email: user.email || "",
        institution: user.institution || "",
        department: user.department || "",
        role: user.role || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        googleScholar: user.googleScholar || "",
        github: user.github || "",
        twitter: user.twitter || "",
        linkedin: user.linkedin || "",
        orcid: user.orcid || "",
        researchInterests: user.researchInterests || [],
        publications: user.publications || "12",
        citations: user.citations || "450",
        hIndex: user.hIndex || "8",
        currentProjects: user.currentProjects || [
             { name: "Neural Architecture Search", status: "Active" },
             { name: "Quantum ML Hybrid", status: "Planning" }
        ],
      });
    }
  }, [user]);

  const updateField = (field: string) => (value: string) => {
    // Optimistic update
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Update context
    // We need to map 'fullName' back to firstName/lastName if needed, but UserContext might not have fullName.
    // User type usually has firstName, lastName.
    let updates: Partial<User> = {};
    if (field === 'fullName') {
        const [first, ...rest] = value.split(' ');
        updates = { firstName: first, lastName: rest.join(' ') };
    } else {
        updates = { [field]: value };
    }
    
    updateUser(updates);
    
    toast({
        title: "Profile updated",
        description: `${field} saved successfully.`,
    });
  }



  const handleAddProject = () => {
      // Mock adding a project
      const newProject = { name: "New Research Project", status: "Planning" as const };
      const updatedProjects = [...profileData.currentProjects, newProject];
      
      setProfileData(prev => ({ ...prev, currentProjects: updatedProjects }));
      updateUser({ currentProjects: updatedProjects });
      
      toast({
          title: "Project added",
          description: "New project initialized.",
      });
  }

  const [newInterest, setNewInterest] = useState("")
  const [imageUrl, setImageUrl] = useState("/professional-researcher-avatar.png")

  const addInterest = () => {
    if (newInterest.trim()) {
      const updatedInterests = [...profileData.researchInterests, newInterest.trim()];
      setProfileData({
        ...profileData,
        researchInterests: updatedInterests
      })
      updateUser({ researchInterests: updatedInterests });
      setNewInterest("")
      toast({ title: "Interest added" });
    }
  }

  const removeInterest = (index: number) => {
    const updatedInterests = profileData.researchInterests.filter((_, i) => i !== index);
    setProfileData({
      ...profileData,
      researchInterests: updatedInterests
    })
    updateUser({ researchInterests: updatedInterests });
    toast({ title: "Interest removed" });
  }

  return (
    <div className="layout-container relative overflow-hidden">
      <AnimatedTechBackground variant="grid" />
      <NavigationSidebar />

      <main className="layout-main">
        {/* Header Section */}
        {/* Header Section */}
        <header className="layout-header bg-background/30 backdrop-blur-xl border-b border-white/10 p-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start gap-8">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {profileData.fullName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-background"
                >
                  <Camera size={16} />
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-foreground" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                    <EditableField value={profileData.fullName} onChange={updateField("fullName")} />
                  </h1>
                  <p className="text-primary text-lg font-medium">
                    <EditableField value={profileData.role} onChange={updateField("role")} />
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-primary" />
                    <EditableField value={profileData.institution} onChange={updateField("institution")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <EditableField value={profileData.location} onChange={updateField("location")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    <EditableField value={profileData.email} onChange={updateField("email")} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="card-default p-4 text-center border border-primary/20 hover:border-primary/40 transition-colors">
                  <div className="text-2xl font-bold text-foreground">
                    <EditableField value={profileData.publications} onChange={updateField("publications")} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Publications</div>
                </div>
                <div className="card-default p-4 text-center border border-primary/20 hover:border-primary/40 transition-colors">
                  <div className="text-2xl font-bold text-foreground">
                    <EditableField value={profileData.citations} onChange={updateField("citations")} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Citations</div>
                </div>
                <div className="card-default p-4 text-center border border-primary/20 hover:border-primary/40 transition-colors">
                  <div className="text-2xl font-bold text-foreground">
                    <EditableField value={profileData.hIndex} onChange={updateField("hIndex")} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">h-index</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="layout-content max-w-6xl mx-auto p-8 space-y-6 relative z-10">
          {/* Bio Section */}
          <div className="rounded-2xl p-8 border border-white/10 bg-background/20 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              About
            </h2>
            <EditableField
              value={profileData.bio}
              onChange={updateField("bio")}
              placeholder="Add your bio..."
              multiline
              className="text-muted-foreground"
            />
          </div>

          {/* Research Interests */}
          <div className="rounded-2xl p-8 border border-white/10 bg-background/20 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              Research Interests
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.researchInterests.map((interest, index) => (
                <Badge
                  key={index}
                  className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(index)}
                    className="hover:text-primary/80"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add research interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addInterest()}
                className="rounded-lg border-border/50"
              />
              <Button onClick={addInterest} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Links Section */}
          <div className="rounded-2xl p-8 border border-white/10 bg-background/20 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              Links & Profiles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Globe className="text-primary" size={20} />
                <EditableField value={profileData.website} onChange={updateField("website")} placeholder="Add website..." />
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary" size={20} />
                <EditableField value={profileData.googleScholar} onChange={updateField("googleScholar")} placeholder="Add Google Scholar..." />
              </div>
              <div className="flex items-center gap-3">
                <Github className="text-primary" size={20} />
                <EditableField value={profileData.github} onChange={updateField("github")} placeholder="Add GitHub..." />
              </div>
              <div className="flex items-center gap-3">
                <Twitter className="text-primary" size={20} />
                <EditableField value={profileData.twitter} onChange={updateField("twitter")} placeholder="Add Twitter..." />
              </div>
              <div className="flex items-center gap-3">
                <Linkedin className="text-primary" size={20} />
                <EditableField value={profileData.linkedin} onChange={updateField("linkedin")} placeholder="Add LinkedIn..." />
              </div>
              <div className="flex items-center gap-3">
                <Award className="text-primary" size={20} />
                <EditableField value={profileData.orcid} onChange={updateField("orcid")} placeholder="Add ORCID..." />
              </div>
            </div>
          </div>

          {/* Current Projects */}
          <div className="rounded-2xl p-8 border border-white/10 bg-background/20 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              Current Projects
            </h2>
            <div className="space-y-3">
              {profileData.currentProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors border border-border/30 rounded-lg">
                  <span className="font-medium text-foreground">
                    {project.name}
                  </span>
                  <Badge
                    className={project.status === "Active" ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground border-border"}
                  >
                    {project.status}
                  </Badge>
                </div>
              ))}
              <Button className="w-full btn-primary" onClick={handleAddProject}>
                <Plus size={16} className="mr-2" />
                Add Project
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}