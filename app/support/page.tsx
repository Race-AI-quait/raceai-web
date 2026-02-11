"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, BookOpen, Clock } from "lucide-react";
import UnifiedInteractiveGrid from "@/components/unified-interactive-grid";
import { SimpleThemeToggle } from "@/components/theme-toggle";
import ModernLogo from "@/components/modern-logo";

export default function SupportPage() {
  return (
    <div className="min-h-screen relative font-outfit">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-background dark:bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]">
        <UnifiedInteractiveGrid />
      </div>

      {/* Header */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <ModernLogo size={40} showText={true} />
        </Link>
      </div>
      <div className="fixed top-6 right-6 z-50">
        <SimpleThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container-md px-6 py-24 min-h-screen flex flex-col items-center">
        <motion.div
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
             <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                How can we help?
             </h1>
             <p className="text-lg text-muted-foreground">
                Our team is here to support your research journey.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Contact Card */}
             <div className="card-glass backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 p-8 rounded-xl shadow-lg hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Support</h3>
                <p className="text-muted-foreground mb-6">
                   Get in touch with our support team for account issues or technical questions.
                </p>
                <a href="mailto:support@raceai.com" className="text-primary font-medium hover:underline inline-flex items-center">
                   support@raceai.com <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </a>
             </div>

             {/* Documentation Card (Placeholder for now) */}
             <div className="card-glass backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 p-8 rounded-xl shadow-lg hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Knowledge Base</h3>
                <p className="text-muted-foreground mb-6">
                   Browse tutorials, guides, and FAQs to get the most out of RaceAI.
                </p>
                <button className="text-primary font-medium hover:underline inline-flex items-center opacity-50 cursor-not-allowed">
                   Coming Soon
                </button>
             </div>
          </div>
          
          <div className="mt-12 text-center">
             <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Typical response time: Under 24 hours</span>
             </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
