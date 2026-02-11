"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Lightbulb, FolderKanban, Users, ArrowRight, Book, Atom, Network, FileText, Sparkles, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const steps = [
  {
    id: 1,
    title: "Ask & Inquire",
    description: "Start with a question. Jarvis breaks it down and guides your initial exploration.",
    icon: <MessageSquare className="w-5 h-5" />,
    dataShape: <Book className="w-5 h-5 text-blue-400" />, 
    color: "bg-blue-600",
  },
  {
    id: 2,
    title: "Discover Sources",
    description: "Your query transforms into a deep search across millions of papers and datasets.",
    icon: <Search className="w-5 h-5" />,
    dataShape: <FileText className="w-5 h-5 text-indigo-400" />,
    color: "bg-indigo-500", 
  },
  {
    id: 3,
    title: "Connect Concepts",
    description: "Synthesize findings. Connect disparate ideas into a coherent graph of knowledge.",
    icon: <Lightbulb className="w-5 h-5" />,
    dataShape: <Atom className="w-5 h-5 text-violet-400" />,
    color: "bg-violet-600", 
  },
  {
    id: 4,
    title: "Structure Work",
    description: "Organize insights into actionable projects and tasks automatically.",
    icon: <FolderKanban className="w-5 h-5" />,
    dataShape: <Network className="w-5 h-5 text-cyan-400" />,
    color: "bg-cyan-600",
  },
  {
    id: 5,
    title: "Collaborate",
    description: "Share your structured knowledge with peers to accelerate breakthroughs.",
    icon: <Users className="w-5 h-5" />,
    dataShape: <Users className="w-5 h-5 text-sky-400" />,
    color: "bg-sky-500",
  }
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle with pause on hover
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000); // Slower, more readable pace
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="w-full max-w-7xl mx-auto py-24 px-6 relative overflow-hidden">
      
      {/* 1. Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-3xl mx-auto mb-24 relative"
      >
         <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -z-10" />
         
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            The Workflow
         </div>

         <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-6">
            From <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Curiosity</span> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Breakthrough</span>
         </h2>
         
         <p className="text-lg text-muted-foreground leading-relaxed">
            See how your research evolves from a simple question into a powerful collaborative project with an AI companion built for researchers.
         </p>
      </motion.div>


      {/* 2. Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start" ref={containerRef}>
         
         {/* Left Column: Visualizer (The "Doing" part) */}
         <div className="order-2 lg:order-1 relative h-[500px] lg:h-[600px] w-full hidden lg:block">
             <div className="sticky top-32 w-full h-full flex items-center justify-center">
                
                {/* Visual Representation of current step */}
                <div className="relative w-full max-w-md aspect-square">
                    {/* Background Gradients */}
                    <motion.div 
                        animate={{ 
                            background: `radial-gradient(circle at center, ${steps[activeStep].color}20 0%, transparent 70%)` 
                        }}
                        className="absolute inset-0 blur-3xl transition-colors duration-1000"
                    />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.1, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="w-full h-full relative z-10 flex items-center justify-center"
                        >
                            <div className="card-tech w-full h-full flex flex-col items-center justify-center gap-6 p-8 border-primary/10 bg-background/50 backdrop-blur-xl">
                                <motion.div 
                                    layoutId="active-icon"
                                    className={`w-24 h-24 rounded-3xl ${steps[activeStep].color} flex items-center justify-center text-white shadow-2xl`}
                                >
                                    <div className="scale-[2.5]">
                                        {steps[activeStep].dataShape}
                                    </div>
                                </motion.div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold mb-2">{steps[activeStep].title}</h3>
                                    <p className="text-muted-foreground">{steps[activeStep].description}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

             </div>
         </div>

         {/* Right Column: Steps (Interactive Timeline) */}
         <div className="order-1 lg:order-2 flex flex-col gap-0 relative pl-4 lg:pl-0"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
         >
             
             {/* TIMELINE TRACK */}
             <div className="absolute left-[27px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5 hidden lg:block" />

             {steps.map((step, index) => {
                 const isActive = activeStep === index;
                 
                 return (
                   <motion.div 
                     key={step.id}
                     className="relative flex items-center gap-8 group py-6 cursor-pointer"
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: index * 0.1 }}
                     onClick={() => setActiveStep(index)}
                   >
                       {/* Node Point (Connecting Dot) */}
                       <div className="hidden lg:flex relative shrink-0 z-10">
                           <motion.div 
                               animate={{ 
                                  scale: isActive ? 1 : 0.8,
                                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                                  borderColor: isActive ? "var(--primary)" : "rgba(148, 163, 184, 0.3)"
                               }}
                               className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors duration-500 bg-background`}
                           >
                               <span className={`text-sm font-bold ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                   0{step.id}
                               </span>
                           </motion.div>
                           
                           {/* Pulse Effect for active */}
                           {isActive && (
                               <motion.div
                                   layoutId="active-pulse"
                                   className="absolute inset-0 rounded-full bg-primary/30 z-[-1]"
                                   initial={{ scale: 1 }}
                                   animate={{ scale: 1.5, opacity: 0 }}
                                   transition={{ duration: 1.5, repeat: Infinity }}
                               />
                           )}
                       </div>

                       {/* Content Card */}
                       <div className={`
                            flex-1 p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden
                            ${isActive 
                                ? 'card-tech border-primary/30 ring-1 ring-primary/20 translate-x-2' 
                                : 'border-transparent hover:bg-muted/30 hover:border-border/50'
                            }
                       `}>
                           {/* Mobile Icon (since left col hidden) */}
                           <div className="lg:hidden mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                               {step.icon}
                           </div>

                           <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`font-semibold text-xl mb-2 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {step.title}
                                    </h3>
                                    <AnimatePresence>
                                        {(isActive || !isActive) && (
                                            <motion.p 
                                                initial={false}
                                                animate={{ 
                                                    height: "auto",
                                                    opacity: isActive ? 1 : 0.7 
                                                }}
                                                className={`text-sm leading-relaxed ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                                            >
                                                {step.description}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {isActive && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-primary hidden sm:block"
                                    >
                                        <ChevronRight />
                                    </motion.div>
                                )}
                           </div>
                       </div>
                   </motion.div>
                 )
             })}
         </div>

      </div>

    </section>
  );
}

