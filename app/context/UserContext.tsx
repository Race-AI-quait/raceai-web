"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ResearchProject {
  name: string;
  status: "Active" | "Planning" | "Completed";
}

export interface User {
  // Authentication
  id?: string;
  email: string;
  password?: string;
  authenticated?: boolean;
  onboarded?: boolean;

  // Personal Details
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  organization?: string;
  institution?: string;
  department?: string;
  bio?: string;
  location?: string;

  // Profile & Preferences
  profilePicture?: string;
  profileType?: "upload" | "avatar";
  interests?: string[];

  // Research / Academic Details
  researchInterests?: string[];
  publications?: string;
  citations?: string;
  hIndex?: string;
  currentProjects?: ResearchProject[];

  // Social / External Links
  website?: string;
  googleScholar?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  orcid?: string;

  // Verification
  verificationCode?: string;

  // System
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserContextType {
  user: User | null;
  updateUser: (data: Partial<User>) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...data } as User));
  };

  const clearUser = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
