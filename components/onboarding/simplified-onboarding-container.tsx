"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmailVerification from "./email-verification";
import SimplifiedOnboarding from "./simplified-onboarding";

interface UserData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organization?: string;
  interests?: string[];
  verificationCode?: string;
  profilePicture?: string;
  profileType?: "upload" | "avatar";
}

interface Props {
  initialUserData?: Partial<UserData>;
  onComplete: (userData: UserData) => void;
}

export default function SimplifiedOnboardingContainer({
  initialUserData = {},
  onComplete,
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<Partial<UserData>>(initialUserData);

  const updateUserData = (data: Partial<UserData>) =>
    setUserData((prev) => ({ ...prev, ...data }));

  const nextStep = () => setCurrentStep((p) => p + 1);
  const prevStep = () => setCurrentStep((p) => p - 1);

  const handleComplete = (profileData: Partial<UserData>) => {
    const completeData = { ...userData, ...profileData } as UserData;
    console.log("✅ Final onboarding data before sending to parent:", completeData);
    // Submit final data to Supabase if needed, or just pass up
    if (onComplete) onComplete(completeData);
  };

  return (
    <div className="w-full">
      {currentStep === 1 && (
        <EmailVerification
          email={userData.email || ""}
          onNext={(code) => {
            updateUserData({ verificationCode: code });
            nextStep();
          }}
          onBack={() => router.push("/")}
        />
      )}
      {currentStep === 2 && (
        <SimplifiedOnboarding
          onComplete={handleComplete}
          onBack={prevStep}
          initialData={userData}
        />
      )}
    </div>
  );
}



