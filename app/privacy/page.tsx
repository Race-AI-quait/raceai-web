"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UnifiedInteractiveGrid from "@/components/unified-interactive-grid";
import { SimpleThemeToggle } from "@/components/theme-toggle";
import ModernLogo from "@/components/modern-logo";

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 24, 2026</p>

            <div className="prose dark:prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">1. Introduction</h2>
                <p>
                  RaceAI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website and use our research assistant services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">2. Information We Collect</h2>
                <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                  <li><strong>Personal Data:</strong> Name, email address, and account credentials when you register.</li>
                  <li><strong>Research Data:</strong> Queries, uploaded documents, and interaction history with our AI.</li>
                  <li><strong>Usage Data:</strong> Information about how you use our platform to help us improve user experience.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">3. How We Use Your Data</h2>
                <p>
                  We use your data strictly to provide and improve the RaceAI services. We do <strong className="text-foreground">not</strong> sell your personal research data to third parties. Your data is used to:
                </p>
                <ul className="list-disc pl-6 space-y-2 marker:text-primary mt-2">
                  <li>Personalize your research companion experience.</li>
                  <li>Improve the accuracy of our AI models (only with anonymized data).</li>
                  <li>Process transactions and send related alerts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">4. Data Security</h2>
                <p>
                  We implement enterprise-grade security measures including end-to-end encryption for sensitive data and regular security audits to protect your intellectual property.
                </p>
              </section>

              <section>
                 <h2 className="text-2xl font-semibold mb-4 text-primary">5. Contact Us</h2>
                 <p>
                    If you have questions about this policy, please contact us at <a href="mailto:privacy@raceai.com" className="text-primary hover:underline">privacy@raceai.com</a>.
                 </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
