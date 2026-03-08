"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronRight,
  Share,
  Mic,
  Edit3,
  Award,
  Calendar,
  DollarSign,
  Building,
  ExternalLink,
  BookOpen,
  Zap,
  Cpu,
  Dna,
  Brain,
  Atom,
} from "lucide-react";
import NavigationSidebar from "@/components/navigation-sidebar";
import GeometricBackground from "@/components/geometric-background";

interface SOTAProblem {
  id: string;
  title: string;
  category: string;
  description: string;
  detailedDescription: string;
  resources: string[];
  prize: string;
  awardedBy: string[];
  deadline?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  tags: string[];
}

export default function SOTAProblemsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProblem, setSelectedProblem] = useState<SOTAProblem | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newTopicInput, setNewTopicInput] = useState("");

  const categories = [
    { id: "all", label: "All", icon: Zap },
    { id: "quantum", label: "Quantum Computing", icon: Atom },
    { id: "ai", label: "Artificial Intelligence", icon: Brain },
    { id: "gene", label: "Gene Editing", icon: Dna },
    { id: "computing", label: "Computing", icon: Cpu },
  ];

  const sotaProblems: SOTAProblem[] = [
    {
      id: "1",
      title: "Electron Transfer Simulation in DNA using Quantum Computers",
      category: "quantum",
      description:
        "Simulating the electron transfer in DNA base pairs to identify the energy conditions for the free radical release",
      detailedDescription:
        "This challenge focuses on developing quantum algorithms to accurately simulate electron transfer processes in DNA base pairs. The goal is to understand the precise energy conditions that lead to free radical formation, which has significant implications for understanding DNA damage and repair mechanisms. Successful solutions could revolutionize our understanding of radiation-induced DNA damage and lead to better cancer treatments.",
      resources: [
        "Quantum Chemistry Simulation Papers",
        "DNA Structure Databases",
        "Quantum Computing Frameworks",
        "Molecular Dynamics Software",
      ],
      prize: "$500,000",
      awardedBy: ["Google", "IBM"],
      deadline: "2025-06-30",
      difficulty: "Expert",
      tags: ["Quantum Chemistry", "DNA", "Molecular Simulation", "Biophysics"],
    },
    {
      id: "2",
      title: "Fault-Tolerant Quantum Error Correction",
      category: "quantum",
      description:
        "Develop practical quantum error correction codes that can operate with current noisy quantum devices",
      detailedDescription:
        "Create quantum error correction schemes that can effectively protect quantum information in near-term quantum computers with high error rates. The solution should demonstrate significant improvement in logical qubit fidelity while maintaining reasonable overhead in terms of physical qubits required.",
      resources: [
        "Quantum Error Correction Literature",
        "Quantum Hardware Specifications",
        "Simulation Tools",
      ],
      prize: "$1,000,000",
      awardedBy: ["Microsoft", "Amazon"],
      deadline: "2025-12-31",
      difficulty: "Expert",
      tags: ["Quantum Computing", "Error Correction", "Fault Tolerance"],
    },
    {
      id: "3",
      title: "General Artificial Intelligence Benchmark",
      category: "ai",
      description:
        "Create a comprehensive benchmark for measuring progress toward artificial general intelligence",
      detailedDescription:
        "Design and implement a standardized benchmark suite that can accurately measure an AI system's progress toward general intelligence across multiple domains including reasoning, learning, creativity, and social understanding.",
      resources: [
        "AI Evaluation Frameworks",
        "Cognitive Science Research",
        "Multi-domain Datasets",
      ],
      prize: "$750,000",
      awardedBy: ["OpenAI", "DeepMind"],
      difficulty: "Advanced",
      tags: ["AGI", "Benchmarking", "AI Evaluation", "Machine Learning"],
    },
    {
      id: "4",
      title: "Precision Gene Editing with Minimal Off-Target Effects",
      category: "gene",
      description:
        "Develop CRISPR-based gene editing tools with near-zero off-target modifications",
      detailedDescription:
        "Engineer next-generation gene editing systems that can make precise modifications to target genes while eliminating unintended changes elsewhere in the genome. This is crucial for safe therapeutic applications of gene editing.",
      resources: [
        "CRISPR Databases",
        "Genome Analysis Tools",
        "Clinical Trial Data",
      ],
      prize: "$2,000,000",
      awardedBy: ["NIH", "Gates Foundation"],
      deadline: "2025-09-15",
      difficulty: "Expert",
      tags: ["CRISPR", "Gene Therapy", "Precision Medicine", "Biotechnology"],
    },
    {
      id: "5",
      title: "Energy-Efficient AI Computing Architecture",
      category: "computing",
      description:
        "Design computing architectures that reduce AI training energy consumption by 1000x",
      detailedDescription:
        "Develop novel computing architectures, algorithms, or hybrid approaches that can dramatically reduce the energy required for training large AI models while maintaining or improving performance.",
      resources: [
        "Hardware Design Papers",
        "Energy Efficiency Studies",
        "AI Training Frameworks",
      ],
      prize: "$300,000",
      awardedBy: ["NVIDIA", "Intel"],
      difficulty: "Advanced",
      tags: [
        "Green Computing",
        "AI Hardware",
        "Energy Efficiency",
        "Sustainability",
      ],
    },
  ];

  const filteredProblems = sotaProblems.filter((problem) => {
    const matchesCategory =
      selectedCategory === "all" || problem.category === selectedCategory;
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProblemSelect = (problem: SOTAProblem) => {
    setSelectedProblem(problem);
  };

  const handleAddToProjects = () => {
    if (selectedProblem) {
      // Handle adding to projects
      console.log("Adding to projects:", selectedProblem.title);
    }
  };

  const handleCreatePodcast = () => {
    if (selectedProblem) {
      // Handle podcast creation
      console.log("Creating podcast for:", selectedProblem.title);
    }
  };

  const handleShare = () => {
    if (selectedProblem) {
      // Handle sharing
      console.log("Sharing:", selectedProblem.title);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-orange-100 text-orange-800";
      case "Expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-screen overflow-y-hidden flex relative">
      <div className="dark:hidden absolute inset-0 z-0 pointer-events-none">
        <GeometricBackground variant="tesseract" />
      </div>
      <NavigationSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50 glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                S-O-T-A Problems
              </h1>
              <p className="text-muted-foreground">
                State-of-the-art challenges waiting to be solved
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                FIND WORLD'S BIGGEST PROBLEMS
              </span>
              <div className="flex items-center gap-3 w-80 px-4 h-10 rounded-md glass-card border border-border transition-all duration-200 focus-within:border-primary/50">

                {/* Left search icon */}
                <Search className="h-4 w-4 text-muted-foreground" />

                {/* Input */}
                <input
                  type="text"
                  placeholder="Search a topic"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    flex-1 
                    bg-transparent 
                    outline-none 
                    border-none 
                    text-sm
                    placeholder:text-muted-foreground
                  "
                  style={{
                    boxShadow: "none",
                    WebkitBoxShadow: "none",
                    outline: "none",
                    border: "none",
                  }}
                />

              </div>

            </div>
          </div>

          {/* Category Filters */}
          <div className="flex space-x-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${selectedCategory === category.id
                    ? "btn-primary shadow-lg"
                    : "glass-card border-border/50 hover:border-primary/50"
                    }`}
                >
                  <Icon size={16} />
                  <span>{category.label}</span>
                </Button>
              );
            })}
            <Button
              variant="outline"
              className="ml-auto glass-card border-border/50 hover:border-primary/50 transition-all duration-200"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex ">
          {/* Problems List */}
          <div className="w-1/2 border-r border-border/50 glass-card">
            <ScrollArea className="h-[calc(100vh-50px)] px-6 pt-6">
              <div className="space-y-4">
                {filteredProblems.map((problem) => (
                  <div key={problem.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <Card
                      className={`relative cursor-pointer glass-card transition-all duration-300 hover:border-primary/50 ${selectedProblem?.id === problem.id
                        ? "ring-2 ring-primary border-primary/50"
                        : ""
                        }`}
                      onClick={() => handleProblemSelect(problem)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-foreground pr-4">
                            {problem.title}
                          </CardTitle>
                          <Badge
                            className={getDifficultyColor(problem.difficulty)}
                          >
                            {problem.difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-3">
                          {problem.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Award size={12} />
                              <span>{problem.prize}</span>
                            </div>
                            {problem.deadline && (
                              <div className="flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>
                                  {new Date(
                                    problem.deadline
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Problem Details */}
          <div className="flex-1 h-[calc(100vh-50px)] flex flex-col">
            {selectedProblem ? (
              <>
                <div className="p-6 border-b border-border/50 glass-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {selectedProblem.title}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                        <Badge
                          className={getDifficultyColor(
                            selectedProblem.difficulty
                          )}
                        >
                          {selectedProblem.difficulty}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <DollarSign size={14} />
                          <span>{selectedProblem.prize}</span>
                        </div>
                        {selectedProblem.deadline && (
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>
                              Due:{" "}
                              {new Date(
                                selectedProblem.deadline
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddToProjects}
                      variant="outline"
                      className="glass-card border-border/50 hover:border-primary/50 transition-all duration-200"
                    >
                      Add to Projects
                    </Button>
                    <Button
                      onClick={handleCreatePodcast}
                      variant="outline"
                      className="glass-card border-border/50 hover:border-primary/50 transition-all duration-200"
                    >
                      Create Podcast
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="glass-card border-border/50 hover:border-primary/50 transition-all duration-200"
                    >
                      <Share size={16} className="mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {/* Problem Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Problem:
                      </h3>
                      <p className="text-foreground leading-relaxed">
                        {selectedProblem.description}
                      </p>
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Description:
                      </h3>
                      <p className="text-foreground leading-relaxed">
                        {selectedProblem.detailedDescription}
                      </p>
                    </div>

                    {/* Resources */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Resources:
                      </h3>
                      <ul className="space-y-2">
                        {selectedProblem.resources.map((resource, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-foreground"
                          >
                            <ExternalLink
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prize */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Prize:
                      </h3>
                      <p className="text-foreground">{selectedProblem.prize}</p>
                    </div>

                    {/* Awarded By */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Awarded by:
                      </h3>
                      <div className="flex space-x-2">
                        {selectedProblem.awardedBy.map((org) => (
                          <Badge
                            key={org}
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            <Building size={12} />
                            <span>{org}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Tags:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProblem.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select a Problem
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a SOTA problem from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
