"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UnifiedInteractiveGrid from "@/components/unified-interactive-grid";
import SimplifiedOnboardingContainer from "@/components/onboarding/simplified-onboarding-container";
import dynamic from "next/dynamic";


const Tesseract3D = dynamic(() => import("@/components/tesseract-3d"), { ssr: false });
import { useUser } from "../context/UserContext";
import { User } from "../context/UserContext";
import { SimpleThemeToggle } from "@/components/theme-toggle";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [userData, setUserData] = useState<User | null>(null);
  const [error, setError] = useState("");

  // Load from context
  useEffect(() => {
    if (user) setUserData(user);
    // If no user in context, we might rely on localStorage or just wait?
    // For now, let's allow it to render so we can see the UI even if state is partial.
  }, [user]);

  const handleOnboardingComplete = async (completedUserData: User) => {
    const updatedUser = {
      ...completedUserData,
      authenticated: true,
      onboarded: true,
    };

    localStorage.setItem("race_ai_user", JSON.stringify(updatedUser));
    
    // Update context
    updateUser(updatedUser);

    try {
      // Call Backend to create User record
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`;
      
      const payload = {
        email: completedUserData.email,
        name: `${completedUserData.firstName || ''} ${completedUserData.lastName || ''}`.trim(),
        firstName: completedUserData.firstName,
        lastName: completedUserData.lastName,
        preferences: {
            interests: completedUserData.interests,
            role: completedUserData.role,
            organization: completedUserData.organization
        },
        // Optional: map other fields if they exist in UserData
      };

      console.log("Sending signup payload:", payload);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        // If user already exists (409), we can treat it as success (they just onboarded again?)
        // or just log it. For now, let's allow proceeding if it's 409 or 201.
        if (res.status === 409) {
            console.warn("User already exists in backend, proceeding...");
        } else {
            throw new Error(errData.message || "Backend signup failed");
        }
      }

      const data = await res.json();
      console.log("Backend response:", data);

      router.push("/jarvis");
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* 1. Background from Home Page */}
      <div className="fixed inset-0 z-0 bg-background dark:bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]">
        <UnifiedInteractiveGrid />
      </div>

       {/* Theme Toggle */}
       <div className="fixed top-6 right-6 z-50">
        <SimpleThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-xl">
               {userData ? (
                 <SimplifiedOnboardingContainer
                   initialUserData={userData}
                   onComplete={handleOnboardingComplete}
                 />
               ) : (
                  // Loading State
                  <div className="flex flex-col items-center gap-4 p-8 glass-panel rounded-2xl">
                     <div className="w-8 h-8 relative">
                        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <p className="text-primary font-mono text-sm">Authenticating...</p>
                  </div>
               )}
            </div>
      </div>
    </div>
  );
}
