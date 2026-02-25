"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, Search, Users, Lightbulb, User, Settings, LayoutDashboard, FolderKanban } from "lucide-react"
import ModernLogo from "@/components/modern-logo"
import { ThemeToggle } from "./theme-toggle"
import Image from "next/image"
import { useState, useEffect, useContext } from "react"
import { useChatContext } from "@/app/context/ChatContext"
import { motion, AnimatePresence } from "framer-motion"

// Safe wrapper to avoid errors in pages not wrapped (e.g. auth)
const tryUseChatContext = () => {
  try {
    return useChatContext()
  } catch (e) {
    return null
  }
}

const navigationItems = [
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    path: "/jarvis",
  },
  {
    id: "knowledge",
    label: "Knowledge & Discovery",
    icon: Search,
    path: "/knowledge",
  },
  {
    id: "research-hub",
    label: "Research Hub",
    icon: FolderKanban,
    path: "/research2",
  },
  {
    id: "research",
    label: "Collaborate",
    icon: Users,
    path: "/research",
  },
  {
    id: "problems",
    label: "SOTA",
    icon: Lightbulb,
    path: "/problems",
  },
]

const secondaryNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
  },
]



export default function NavigationSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  // Safely get context (might be null if outside provider, though layout wraps usage)
  const chatContext = tryUseChatContext()
  const isGenerating = chatContext?.isGenerating || false

  useEffect(() => {
    // Get user profile picture from localStorage
    const savedProfileImage = localStorage.getItem("profile_image")
    if (savedProfileImage) {
      setProfilePicture(savedProfileImage)
    }
  }, [])

  const handleLogoClick = () => {
    const isSignedIn = true
    if (isSignedIn) {
      router.push("/jarvis")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="w-16 glass-card flex flex-col items-center pt-2 pb-4 relative z-50">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={handleLogoClick}>
        <ModernLogo size={50} showText={false} />
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col mt-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.path)}
              className={`w-10 h-10 p-0 rounded-xl transition-all duration-200 group relative ${isActive
                ? "active-nav-minimal text-blue-600 dark:text-blue-400"
                : "bg-transparent text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground"
                }`}
              title={item.label}
            >
              {// Removed motion.div glow to match minimal style
              }
              <Icon
                size={20}
                className={`relative z-10 ${isActive ? "text-blue-600 dark:text-blue-400" : "currentColor"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </Button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-border/40 my-4"></div>

      {/* Secondary Navigation Items */}
      <div className="flex flex-col space-y-2">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.path)}
              className={`w-10 h-10 p-0 rounded-xl transition-all duration-200 group relative ${isActive
                ? "active-nav-minimal text-blue-600 dark:text-blue-400"
                : "bg-transparent text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground"
                }`}
              title={item.label}
            >
              { // Removed motion.div glow to match minimal style 
              }
              <Icon
                size={20}
                className={`relative z-10 ${isActive ? "text-blue-600 dark:text-blue-400" : "currentColor"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </Button>
          )
        })}
      </div>

      <div className="mt-auto mb-4 flex flex-col items-center gap-2">
        <ThemeToggle />
      </div>
      {/* Profile Section */}
      <div className="flex flex-col items-center space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className={`w-10 h-10 p-0 rounded-xl transition-all duration-300 ease-in-out group relative hover:scale-105 ${pathname === "/settings"
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          title="Settings"
        >
          <Settings
            size={20}
            className={pathname === "/settings" ? "text-white" : "currentColor"}
            strokeWidth={pathname === "/settings" ? 2.5 : 2}
          />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/profile")}
          className={`w-10 h-10 p-0 rounded-xl transition-all duration-300 ease-in-out group relative overflow-hidden hover:scale-105 ${pathname === "/profile"
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          title="Profile"
        >
          {profilePicture ? (
            <div className={pathname === "/profile" ? "ring-2 ring-white rounded-full" : ""}>
              <Image
                src={profilePicture}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <User
              size={20}
              className={pathname === "/profile" ? "text-white" : "currentColor"}
              strokeWidth={pathname === "/profile" ? 2.5 : 2}
            />
          )}
        </Button>

        {/* Active Indicator */}
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}
