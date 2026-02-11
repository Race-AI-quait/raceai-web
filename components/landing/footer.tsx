"use client";

import Link from "next/link";
import { Mail, ArrowRight, MapPin, Send } from "lucide-react";
import { useState } from "react";
import ModernLogo from "@/components/modern-logo";

export default function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call / trigger mailto
    setTimeout(() => {
       const subject = `Inquiry from ${formData.name}`;
       const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
       const mailtoLink = `mailto:raceai@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
       
       window.location.href = mailtoLink;
       
       setIsSubmitting(false);
       setSubmitted(true);
    }, 800);
  };

  return (
    <footer className="w-full relative z-10 pt-20 pb-10 bg-muted/30 border-t border-border/50">
      <div className="container-lg px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          
          {/* Left Column: Brand & Info */}
          <div className="space-y-8">
             <ModernLogo size={50} showText={true} />
             
             <p className="text-muted-foreground max-w-sm leading-relaxed">
               Empowering researchers with AI companions that understand the depth of their work. From curiosity to breakthrough.
             </p>

             <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-foreground/80">
                   <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                   <span>
                      123 Innovation Drive,<br />
                      Tech Valley, CA 94025<br />
                      United States
                   </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                   <Mail className="w-5 h-5 text-primary shrink-0" />
                   <a href="mailto:raceai@gmail.com" className="hover:text-primary transition-colors">
                      raceai@gmail.com
                   </a>
                </div>
             </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-sm">
             <h3 className="text-xl font-bold mb-2">Contact Us</h3>
             <p className="text-sm text-muted-foreground mb-6">
               Have a question? We'd love to hear from you.
             </p>
             
             {submitted ? (
               <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                     <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Message Prepared!</p>
                    <p className="text-xs opacity-90">Opening your email client...</p>
                  </div>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <input 
                         required
                         placeholder="Name" 
                         className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <input 
                         required
                         type="email"
                         placeholder="Email" 
                         className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <textarea 
                       required
                       placeholder="How can we help?" 
                       className="w-full h-24 px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                       value={formData.message}
                       onChange={(e) => setFormData({...formData, message: e.target.value})}
                     />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </button>
               </form>
             )}
          </div>

        </div>

        {/* Bottom Links */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
           <p>© 2026 RaceAI. Research Accessible by Everyone.</p>
           <div className="flex gap-6">
              <Link href="/privacy" className="relative group text-foreground/80 hover:text-primary transition-colors duration-300">
                Privacy Policy
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/terms" className="relative group text-foreground/80 hover:text-primary transition-colors duration-300">
                Terms of Service
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/support" className="relative group text-foreground/80 hover:text-primary transition-colors duration-300">
                Support
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
