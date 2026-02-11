"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

interface EmailVerificationProps {
  email: string
  onNext: (code: string) => void
  onBack: () => void
}

export default function EmailVerification({ email, onNext, onBack }: EmailVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [resendCountdown, setResendCountdown] = useState(60)
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const verifyCode = async (codeString: string) => {
    setIsVerifying(true)
    setError("")

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: codeString,
            type: 'signup'
        })

        if (error) throw error

        // If successful
        if (data.session) {
            onNext(codeString)
        } else {
            // Sometimes detailed error isn't returned for wrong code
            setError("Invalid code. Please try again.")
        }

    } catch (err: any) {
        console.error("Verification Error:", err)
        setError(err.message || "Verification failed. Check the code and try again.")
    } finally {
        setIsVerifying(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    if (value.length > 1) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError("")

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    if (newCode.every((digit) => digit) && newCode.join("").length === 6) {
      const codeString = newCode.join("")
      verifyCode(codeString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleManualVerify = () => {
    const codeString = code.join("")
    verifyCode(codeString)
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setIsResending(true)
    setError("")
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email
        })
        
        if (error) throw error
        
        setResendCountdown(60)
        setCode(["", "", "", "", "", ""])
        setTimeout(() => document.getElementById("code-0")?.focus(), 100)
        
    } catch (err: any) {
        console.error("Resend Error:", err)
        setError(err.message || "Failed to resend code.")
    } finally {
        setIsResending(false)
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="bg-background border border-border rounded-xl shadow-lg overflow-hidden">
        
        {/* Clean Header */}
        <div className="p-8 pb-6 text-center space-y-4">
             <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
             </div>
             
             <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Hey! Verify your email</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Enter the secure code sent to <br/>
                    <span className="font-medium text-foreground">{email}</span>
                </p>
             </div>
        </div>

        {/* Input Area */}
        <div className="px-8 pb-8 space-y-6">
            <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                    <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-mono bg-muted/30 border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all ${error ? "border-red-500 focus:border-red-500" : ""}`}
                        disabled={isVerifying}
                    />
                ))}
            </div>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-2">
                        <span>•</span> {error}
                    </p>
                </motion.div>
            )}

            <Button 
                onClick={handleManualVerify}
                disabled={code.some((digit) => !digit) || isVerifying}
                className="w-full h-11 text-sm font-medium"
            >
                {isVerifying ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        Verify Access <ArrowRight className="w-4 h-4" />
                    </div>
                )}
            </Button>

            <div className="text-center">
                 {resendCountdown > 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Resend code in <span className="font-mono">{resendCountdown}s</span>
                    </p>
                 ) : (
                    <button 
                        onClick={handleResend} 
                        disabled={isResending}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                        {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
                        Resend Verification Code
                    </button>
                 )}
            </div>
            
            <div className="pt-4 border-t border-border flex justify-center">
                 <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                   ←Back
                 </button>
            </div>
        </div>

      </div>
    </div>
  )
}
