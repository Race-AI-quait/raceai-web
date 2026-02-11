"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Brain, Search, FileText, Zap } from "lucide-react";
import ModernLogo from "@/components/modern-logo";
import SimplifiedOnboardingContainer from "@/components/onboarding/simplified-onboarding-container";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { SimpleThemeToggle } from "@/components/theme-toggle";
import UnifiedInteractiveGrid from "@/components/unified-interactive-grid";
import { useUser } from "./context/UserContext";
import { useProjects } from "@/app/context/ProjectContext";
import { useChatContext } from "@/app/context/ChatContext";
import HowItWorks from "@/components/landing/how-it-works";
import Footer from "@/components/landing/footer";


interface AuthFormCardProps {
  onAuthSuccess: (userData: any, isNewUser?: boolean) => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  submit: string;
}

const AuthFormCard: React.FC<AuthFormCardProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { setProjects } = useProjects();
  const { setChatSessions } = useChatContext();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: "",
    password: "",
    confirmPassword: "",
    submit: "",
  });
  const router = useRouter();
  const { updateUser } = useUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e || !e.target) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
    }
  };

  const validateForm = () => {
    const errors: Partial<FormErrors> = {};
    
    // Email Validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password Validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(formData.password)) {
        errors.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(formData.password)) {
        errors.password = "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(formData.password)) {
        errors.password = "Password must contain at least one number";
      } else if (!/[!@#$%^&*]/.test(formData.password)) {
        errors.password = "Password must contain at least one special character (!@#$%^&*)";
      }
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    setFormErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };


  const verifyEmail = async () => {
    setIsLoading(true);
    setFormErrors(prev => ({ ...prev, submit: "" }));
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: formData.email,
                code: verificationCode
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Verification failed");
        }

        // Verification success - now treat as login
        const { user, token } = result;
         // Save to localStorage for persistence
        localStorage.setItem("race_ai_user", JSON.stringify(user));
        localStorage.setItem("race_ai_token", token);

        // Update context
        updateUser(user);
        onAuthSuccess(user, true); // Treat as new user for onboarding
    } catch (error: any) {
         setFormErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
        setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setFormErrors((prev) => ({ ...prev, submit: "" }));

    try {
        const endpoint = isSignUp 
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            // Add other fields as defaults if needed for signup
            name: formData.email.split('@')[0]
          }),
        });

        const result = await response.json();

        // Specific Error Handling
        if (!response.ok) {
            // Check for Verification Requirement
            if (response.status === 403 && result.requiresVerification) {
                setIsVerifying(true);
                throw new Error(result.message || "Please verify your email.");
            }
            throw new Error(result.message || "Authentication failed");
        }

        // Handle Signup Success -> Move to Verification
        if (isSignUp) {
             setIsVerifying(true);
             setIsLoading(false);
             return;
        }

        // Handle Signin Success
        const { user, token } = result;
        if (!user || !token) {
          throw new Error("Invalid response from server");
        }

        // Save to localStorage for persistence
        localStorage.setItem("race_ai_user", JSON.stringify(user));
        localStorage.setItem("race_ai_token", token);

        // Update context
        updateUser(user);

        //load chats
        try {
          const chatsResp = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/user/${user.id}`
          );
          if (chatsResp.ok) {
            const chatsJson = await chatsResp.json();
            setChatSessions(chatsJson);
          }
        } catch (err) {}

        // load projects
        try {
          const projectsResp = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/structuredProjects/${user.id}`
          );
          if (projectsResp.ok) {
            const projectsJson = await projectsResp.json();
            setProjects(projectsJson);
          } 
        } catch (err) {}

        // Notify parent if applicable
        onAuthSuccess(user, false);
      
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMessage = error.message || "An unexpected error occurred";
      
      if (errorMessage === "Failed to fetch") {
        errorMessage = "Unable to reach the server. Please check your internet connection or try again later.";
      }
      
      setFormErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };




  /* 
   * NOTE: For Production, you should use `signIn` from `next-auth/react` on the client side.
   * However, since `next-auth` integration often requires SessionProvider wrapping in the root layout,
   * we will implement the handler to redirect to the API routes which standard NextAuth Setup uses.
   * If you have `signIn` available from a hook/import, use it. Here we assume standard path.
   */
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
       // Standard NextAuth pattern: default sign-in route
       // Or `import { signIn } from "next-auth/react"` if you wrap the app in SessionProvider
       // Since we are fixing "correct implementation", let's redirect to the provider flow.
       window.location.href = "/api/auth/signin/google";
    } catch (error) {
      console.error(error);
      setFormErrors((prev) => ({
        ...prev,
        submit: "Failed to sign in with Google",
      }));
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/api/auth/signin/github";
    } catch (error) {
       console.error(error);
      setFormErrors((prev) => ({
        ...prev,
        submit: "Failed to sign in with GitHub",
      }));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto font-outfit">
      <div className="card-tech p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle internal gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Start your research journey" : "Sign in to continue"}
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex bg-muted rounded-lg p-1 mb-6 gap-1">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-all duration-200 ${!isSignUp
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-all duration-200 ${isSignUp
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Sign Up
          </button>
        </div>

        {isVerifying ? (
             <div className="space-y-6">
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                        We sent a verification code to <span className="text-foreground font-medium">{formData.email}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Verification Code</label>
                        <input 
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full text-center text-2xl tracking-widest py-3 h-14 bg-input border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                     {/* Submit Error */}
                    {formErrors.submit && (
                        <p className="text-sm text-red-500 text-center">
                        {formErrors.submit}
                        </p>
                    )}
                    
                    <button
                        onClick={verifyEmail}
                        disabled={isLoading || verificationCode.length < 6}
                        className="w-full btn-primary py-3 rounded-lg font-medium"
                    >
                         {isLoading ? "Verifying..." : "Verify Email"}
                    </button>
                    
                    <button 
                        onClick={() => setIsVerifying(false)}
                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
             </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-11 pr-4 py-3 h-12 text-sm bg-input border border-border rounded-lg transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${formErrors.email ? "border-red-500" : ""
                  }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {formErrors.email && (
              <p className="text-sm text-red-500">{formErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground mb-2 block"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-11 pr-12 py-3 h-12 bg-input border border-border rounded-lg transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${formErrors.password ? "border-red-500" : ""
                  }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-ghost p-1 absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-sm text-red-500">{formErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field - Only for Sign Up */}
          {isSignUp && (
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-11 pr-12 py-3 h-12 bg-input border border-border rounded-lg transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${formErrors.confirmPassword ? "border-red-500" : ""
                    }`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn-ghost p-1 absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit Error */}
          {formErrors.submit && (
            <p className="text-sm text-red-500 text-center">
              {formErrors.submit}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {isSignUp ? "Create Account" : "Sign In"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="relative py-3 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full btn-secondary py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC04"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full btn-secondary py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Footer Text */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? (
                <>
                  By signing up, you agree to our{" "}
                  <a href="#" className="relative group text-primary font-medium hover:text-primary/80 transition-colors">
                    Terms of Service
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </a>{" "}
                  and{" "}
                  <a href="#" className="relative group text-primary font-medium hover:text-primary/80 transition-colors">
                    Privacy Policy
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="relative group text-primary font-medium hover:text-primary/80 transition-colors inline-flex items-center cursor-pointer"
                  >
                    <span>Sign up</span>
                    <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </button>
                </>
              )}
            </p>
          </div>
        </form>
        )}

      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState({});

  const handleOnboardingComplete = (completedUserData: any) => {
    const updatedUser = {
      ...completedUserData,
      authenticated: true,
      onboarded: true,
    };
    localStorage.setItem("race_ai_user", JSON.stringify(updatedUser));
    router.push("/dashboard");
  };

  const handleAuthSuccess = (userData: any, isNewUser: boolean = false) => {
    if (isNewUser) {
      // New user - go to onboarding
      const updatedUser = {
        ...userData,
        authenticated: true,
        onboarded: false,
      };
      localStorage.setItem("race_ai_user", JSON.stringify(updatedUser));
      router.push("/onboarding");
    } else {
      // Existing user - go directly to JARVIS chat
      const updatedUser = {
        ...userData,
        authenticated: true,
        onboarded: true,
      };
      localStorage.setItem("race_ai_user", JSON.stringify(updatedUser));
      router.push("/jarvis");
    }
  };

  if (showOnboarding) {
    return (
      <SimplifiedOnboardingContainer
        initialUserData={userData}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Unified Background: Moving + Rubber Band Physics */}
      <div className="fixed inset-0 z-0 bg-background dark:bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]">
        <UnifiedInteractiveGrid />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <SimpleThemeToggle />
      </div>

      {/* Main Layout - Allow Scrolling (Revert to natural scroll) */ }
      <div className="container-lg w-full relative z-10 px-6 min-h-screen flex flex-col justify-center py-20">
        


        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto gap-12 lg:gap-10">
          
          {/* Top: Value Prop + Steps */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-6"
          >
             <div className="flex flex-col items-center">
  {/* Logo Centered Above Text */}
  <div className="mb-6 scale-125">
    <ModernLogo size={80} showText={false} animated={true} />
  </div>
  
  <div className="relative inline-block">
     {/* <span className="absolute -top-6 -left-8 text-7xl text-primary/10 font-serif font-black -z-10 select-none">“</span>
     <span className="absolute -bottom-4 -right-8 text-7xl text-primary/10 font-serif font-black -z-10 select-none">”</span> */}
     <h1 className="font-space-grotesk text-5xl lg:text-7xl font-bold text-foreground mb-8 tracking-tight leading-tight text-center relative z-10">
       Research Accessible
       <br />
       <span className="text-primary">by Everyone.</span>
     </h1>
  </div>
  
  <div className="space-y-4 max-w-2xl">
    <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed text-center">
      Whether you're just getting started or leading the field, RaceAI helps you find what matters - faster and turn your questions into answers - chapter after chapter.
    </p>
    
   
  </div>
</div>
              
          </motion.div>

          {/* Bottom: Auth Form */}
          <motion.div 
             id="get-started"
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
             className="w-full max-w-md mx-auto relative z-20"
          >
             {/* Using a transparent container to let grid show, assuming auth-form-card handles its own blur or transparency */}
             <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
                <AuthFormCard onAuthSuccess={handleAuthSuccess} />
             </div>
          </motion.div>
          
          {/* How It Works Section */}
          <div className="w-full pt-10">
             <HowItWorks />
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

