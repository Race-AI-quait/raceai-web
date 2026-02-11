"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UnifiedInteractiveGrid from "@/components/unified-interactive-grid";
import { SimpleThemeToggle } from "@/components/theme-toggle";
import ModernLogo from "@/components/modern-logo";

export default function TermsPage() {
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
      <div className="relative z-10 container-md px-6 py-24 min-h-screen flex flex-col">
        <motion.div
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

          <div className="card-glass backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 p-8 md:p-12 rounded-2xl shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Effective Date: January 24, 2026</p>

            <div className="prose dark:prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">1. Agreement to Terms</h2>
                <p>
                  By accessing and using RaceAI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">2. Intellectual Property Rights</h2>
                <p>
                    Unless otherwise indicated, the Site and Services are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") are owned or controlled by us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">3. User Representations</h2>
                <p>
                    By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and you agree to comply with these Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">4. Prohibited Activities</h2>
                <p>
                  You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                </p>
              </section>

              <section>
                 <h2 className="text-2xl font-semibold mb-4 text-primary">5. Termination</h2>
                 <p>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                 </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
