"use client"

import { signIn as nextAuthSignIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useUser } from "@/app/context/UserContext"
import { useProjects } from "@/app/context/ProjectContext"
import { useChatContext } from "@/app/context/ChatContext"
import { submitToHubSpot } from "@/lib/hubspot"
import { supabase } from "@/lib/supabase"
// Sound removed as per user request
// import { useCalmingSound } from "@/hooks/use-calming-sound";

interface AuthFormCardProps {
    onAuthSuccess: (userData: any, isNewUser?: boolean) => void
}

interface FormData {
    email: string
    password: string
    confirmPassword: string
}

interface FormErrors {
    email: string
    password: string
    confirmPassword: string
    submit: string
}

export default function AuthFormCard({ onAuthSuccess }: AuthFormCardProps) {
    const [isSignUp, setIsSignUp] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { setProjects } = useProjects()
    const { setChatSessions } = useChatContext()
    const { updateUser } = useUser()
    const router = useRouter()
    // Sound removed
    // const playSound = useCalmingSound()

    const [formData, setFormData] = useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
    })

    const [formErrors, setFormErrors] = useState<FormErrors>({
        email: "",
        password: "",
        confirmPassword: "",
        submit: "",
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e || !e.target) return
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Clear errors when typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }))
        }
    }

    const validateForm = () => {
        const errors: Partial<FormErrors> = {}
        if (!formData.email) {
            errors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Please enter a valid email address"
        }

        if (!formData.password) {
            errors.password = "Password is required"
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters long"
        }

        if (isSignUp && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords don't match"
        }

        setFormErrors((prev) => ({ ...prev, ...errors }))
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        setFormErrors((prev) => ({ ...prev, submit: "" }))

        try {
            if (isSignUp) {
                // --- SIGN UP: Supabase ---
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.email.split('@')[0],
                        }
                    }
                })

                if (error) throw error

                // Submit to HubSpot
                if (data.user) {
                    await submitToHubSpot({
                        email: data.user.email || formData.email,
                        firstname: formData.email.split('@')[0], 
                        lifecyclestage: "lead"
                    }).catch(err => console.error("HubSpot non-blocking error:", err));
                }

                // Update Context
                updateUser({
                    email: formData.email,
                    id: data.user?.id
                })

                onAuthSuccess(data.user || { email: formData.email }, true)

            } else {
                // --- SIGN IN: Supabase ---
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })

                if (error) throw error

                if (data.user && data.session) {
                    localStorage.setItem("race_ai_token", data.session.access_token)
                    
                    updateUser({
                        ...data.user,
                        email: data.user.email // Ensure email is passed
                    })

                    onAuthSuccess(data.user, false)
                }
            }
        } catch (error: any) {
            console.error("Auth Error:", error)
            
            let errorMessage = error.message || "An unexpected error occurred";
            
            // Improve Supabase error messages
            if (errorMessage.includes("Invalid login credentials")) {
                errorMessage = "Incorrect email or password.";
            } else if (errorMessage.includes("Email not confirmed")) {
                 errorMessage = "Please verify your email address before signing in.";
            }

            setFormErrors((prev) => ({
                ...prev,
                submit: errorMessage,
            }))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialSignIn = async (provider: 'google' | 'github') => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            if (error) throw error
        } catch (error) {
            console.error("Social Auth Error:", error)
            setFormErrors(prev => ({ ...prev, submit: "Social authentication failed." }))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="card-default p-8 bg-transparent shadow-none border-0">

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isSignUp ? "Start your research journey" : "Sign in to continue"}
                    </p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex bg-white/5 dark:bg-black/20 rounded-lg p-1 mb-6 backdrop-blur-sm border border-white/10">
                    <button
                        onClick={() => setIsSignUp(false)}
                        className={`flex-1 py-2.5 px-6 text-sm font-medium rounded-md transition-all duration-200 ${!isSignUp
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsSignUp(true)}
                        className={`flex-1 py-2.5 px-6 text-sm font-medium rounded-md transition-all duration-200 ${isSignUp
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 h-11 text-sm bg-input/50 border border-border rounded-xl transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${formErrors.email ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}`}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>
                        {formErrors.email && <p className="text-xs text-destructive ml-1">{formErrors.email}</p>}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-12 py-3 h-11 text-sm bg-input/50 border border-border rounded-xl transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${formErrors.password ? "border-destructive" : ""}`}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-xs text-destructive ml-1">{formErrors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    {isSignUp && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-medium text-foreground ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`w-full pl-11 pr-12 py-3 h-11 text-sm bg-input/50 border border-border rounded-xl transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${formErrors.confirmPassword ? "border-destructive" : ""}`}
                                    placeholder="Confirm your password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formErrors.confirmPassword && (
                                <p className="text-xs text-destructive ml-1">{formErrors.confirmPassword}</p>
                            )}
                        </div>
                    )}

                    {/* Submit Error */}
                    {formErrors.submit && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center font-medium">
                            {formErrors.submit}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-2"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isSignUp ? "Creating Account..." : "Signing In..."}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                {isSignUp ? "Create Account" : "Sign In"}
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleSocialSignIn('google')} type="button" className="btn-secondary py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted/80 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M24 12.276c0-1.077-.101-2.115-.274-3.122H12.276V13.88h6.606c-.308 1.503-1.168 2.766-2.43 3.593v3.012h3.918c2.29-2.11 3.612-5.226 3.612-8.21z" /><path fill="#34A853" d="M12.276 24c3.298 0 6.066-1.092 8.087-2.963l-3.918-3.013c-1.092.735-2.492 1.177-4.169 1.177-3.195 0-5.903-2.155-6.866-5.063H1.474v3.21C3.542 21.455 7.64 24 12.276 24z" /><path fill="#FBBC05" d="M5.41 14.138c-.244-.735-.386-1.523-.386-2.336 0-.813.142-1.601.386-2.336V6.257H1.474C.535 8.127 0 10.207 0 12.404c0 2.197.535 4.277 1.474 6.147l3.936-3.21z" /><path fill="#4285F4" d="M12.276 4.796c1.728 0 3.364.634 4.654 1.83l3.355-3.355C18.337 1.343 15.569 0 12.276 0 7.64 0 3.542 2.545 1.474 6.257l3.936 3.21c.963-2.909 3.671-5.064 6.866-5.064z" /></svg>
                        Google
                    </button>
                    <button onClick={() => handleSocialSignIn('github')} type="button" className="btn-secondary py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted/80 transition-colors">
                        <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        GitHub
                    </button>
                </div>

            </div>
        </div>
    )
}
