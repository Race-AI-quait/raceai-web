"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import GeometricBackground from "@/components/geometric-background";
import {
  Search,
  Mic,
  TrendingUp,
  Users,
  Map,
  Newspaper,
  DollarSign,
  BookOpen,
  ChevronRight,
  Star,
  Calendar,
  ExternalLink,
  Sparkles,
  Zap,
  Atom,
  Beaker,
  Brain,
  X,
  Share2,
  Bookmark,
  Quote
} from "lucide-react";
import NavigationSidebar from "@/components/navigation-sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

import PDFViewer from "@/components/pdfviewer";
import { useUser } from "../context/UserContext";

interface ResearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date?: string;
  author?: string;
  citations?: number;
  funding?: string;
  url?: string;
}

export default function KnowledgeDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("state-of-art");
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [savedItemsIds, setSavedItemsIds] = useState<string[]>([]);

  // Hydrate saved items on mount
  useState(() => {
     if (typeof window !== "undefined") {
        const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]");
        setSavedItemsIds(saved.map((p: any) => p.id));
     }
  });

  const handleSelectItem = (item: ResearchItem | null) => {
    setSelectedItem(item);
    setShowPDFViewer(false); // Reset PDF viewer state
  };

  const handleSavePaper = (item: ResearchItem) => {
    const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]");
    const existingIndex = saved.findIndex((p: any) => p.id === item.id);
    
    if (existingIndex >= 0) {
        // Remove
        saved.splice(existingIndex, 1);
        localStorage.setItem("saved_papers", JSON.stringify(saved));
        setSavedItemsIds(prev => prev.filter(id => id !== item.id));
        toast({
            title: "Removed from library",
            description: `"${item.title}" has been removed.`,
        });
        
        // If we are currently viewing the saved library, we might want to close the modal if the item is removed? 
        // Or just let the user see it until they close. 
        // But we definitely want to update the filtered list if we are in that view.
        // The filteredData logic below might need a trigger. 
        // By updating `savedItemsIds`, we can trigger a re-render, but `filteredData` logic 
        // needs to re-read localStorage or use the state.
    } else {
        // Add
        saved.push(item);
        localStorage.setItem("saved_papers", JSON.stringify(saved));
        setSavedItemsIds(prev => [...prev, item.id]);
        toast({
            title: "Saved to library",
            description: `"${item.title}" has been saved.`,
        });
    }
  };

  const handleShare = (item: ResearchItem) => {
     const dummyLink = `${window.location.origin}/knowledge?paper=${item.id}`;
     navigator.clipboard.writeText(dummyLink);
     toast({
        title: "Link copied",
        description: "Shareable link copied to clipboard.",
     });
  };

  const handleQuote = (item: ResearchItem) => {
     const citation = `${item.author} (${new Date(item.date || Date.now()).getFullYear()}). ${item.title}. ${item.category}.`;
     navigator.clipboard.writeText(citation);
     toast({
        title: "Citation copied",
        description: "APA format citation copied to clipboard.",
     });
  };


  const fieldCategories = [
    {
      id: "artificial-intelligence",
      label: "AI & ML",
      icon: Brain,
    },
    { id: "quantum-computing", label: "Quantum", icon: Atom },
    { id: "biotechnology", label: "Biotech", icon: Beaker },
    { id: "materials-science", label: "Materials", icon: Zap },
    { id: "energy", label: "Energy", icon: Star },
    { id: "healthcare", label: "Health", icon: Users },
  ];

  const sidebarCategories = [
    {
      id: "state-of-art",
      label: "State of the Art",
      icon: Sparkles,
      color: "bg-blue-500/20",
      dotColor: "bg-blue-500",
    },
    {
      id: "topics-to-research",
      label: "Topics to Research",
      icon: BookOpen,
      color: "bg-emerald-500/20",
      dotColor: "bg-emerald-500",
    },
    {
      id: "recent-groundbreaks",
      label: "Recent Breakthroughs",
      icon: TrendingUp,
      color: "bg-[#4C9AFF]/20",
      dotColor: "bg-[#4C9AFF]",
    },
    {
      id: "top-researchers",
      label: "Top Researchers",
      icon: Users,
      color: "bg-orange-500/20",
      dotColor: "bg-orange-500",
    },
    {
      id: "roadmap",
      label: "Research Roadmap",
      icon: Map,
      color: "bg-indigo-500/20",
      dotColor: "bg-indigo-500",
    },
    {
      id: "news",
      label: "Latest News",
      icon: Newspaper,
      color: "bg-red-500/20",
      dotColor: "bg-red-500",
    },
    {
      id: "saved-library",
      label: "My Library",
      icon: Bookmark,
      color: "bg-purple-500/20",
      dotColor: "bg-purple-500",
    },
  ];

  const researchData: Record<string, ResearchItem[]> = {
    "state-of-art": [
      {
        id: "sota-1",
        title: "Quantum-Neural Hybrid Computing Breakthrough",
        description:
          "Revolutionary integration of quantum and neural computing achieving unprecedented computational efficiency",
        category: "Quantum AI",
        date: "2024-12-25",
        author: "Dr. Elena Vasquez",
        citations: 892,
      },
      {
        id: "sota-2",
        title: "Room-Temperature Nuclear Fusion Achievement",
        description:
          "First successful controlled nuclear fusion reaction at ambient temperature using novel catalysts",
        category: "Energy Physics",
        date: "2024-12-23",
        author: "Prof. Hiroshi Tanaka",
        citations: 1247,
      },
      {
        id: "sota-3",
        title: "AGI Consciousness Emergence",
        description:
          "Documentation of the first artificial general intelligence displaying measurable consciousness patterns",
        category: "Cognitive AI",
        date: "2024-12-22",
        author: "Dr. Amelia Richardson",
        citations: 1689,
      },
      {
        id: "sota-4",
        title: "Biological Age Reversal Protocol",
        description:
          "Comprehensive protocol demonstrating cellular age reversal in human trials",
        category: "Longevity Science",
        date: "2024-12-20",
        author: "Dr. Marcus Chen",
        citations: 1456,
      },
      {
        id: "sota-5",
        title: "Universal Cancer Cure Discovery",
        description:
          "Breakthrough treatment showing 100% success rate across all cancer types in phase III trials",
        category: "Medical Breakthrough",
        date: "2024-12-18",
        author: "Dr. Sarah Martinez",
        citations: 2103,
      },
    ],
    "artificial-intelligence": [
      {
        id: "1",
        title: "AGI Milestone Achievement",
        description:
          "First AI system to pass comprehensive general intelligence tests",
        category: "Artificial Intelligence",
        date: "2024-12-18",
        author: "Dr. Yann LeCun",
        citations: 312,
      },
      {
        id: "2",
        title: "Neural Architecture Search Optimization",
        description: "Advanced techniques for automated neural network design",
        category: "Machine Learning",
        date: "2024-12-10",
        author: "Prof. Michael Rodriguez",
        citations: 189,
      },
      {
        id: "3",
        title: "Large Language Model Efficiency",
        description:
          "Breakthrough in reducing computational costs for LLM training",
        category: "Natural Language Processing",
        date: "2024-12-15",
        author: "Dr. Sarah Chen",
        citations: 245,
      },
    ],
    "machine-learning": [
      {
        id: "4",
        title: "Federated Learning Privacy",
        description: "Enhanced privacy-preserving techniques in distributed ML",
        category: "Privacy Technology",
        date: "2024-12-12",
        author: "Prof. Lisa Wang",
        citations: 156,
      },
      {
        id: "5",
        title: "AutoML for Edge Devices",
        description:
          "Automated machine learning optimization for mobile and IoT devices",
        category: "Edge Computing",
        date: "2024-12-08",
        author: "Dr. James Park",
        citations: 203,
      },
    ],
    "quantum-computing": [
      {
        id: "6",
        title: "Quantum Error Correction Breakthrough",
        description:
          "Revolutionary approach to quantum error correction using topological qubits",
        category: "Quantum Computing",
        date: "2024-12-15",
        author: "Dr. Sarah Chen",
        citations: 245,
      },
      {
        id: "7",
        title: "Quantum Internet Protocols",
        description: "Development of secure quantum communication networks",
        category: "Quantum Networking",
        date: "2024-12-10",
        author: "Prof. Michael Zhang",
        citations: 178,
      },
    ],
    biotechnology: [
      {
        id: "8",
        title: "CRISPR Gene Editing Precision",
        description:
          "Enhanced precision in gene editing with minimal off-target effects",
        category: "Gene Editing",
        date: "2024-12-08",
        author: "Dr. Emily Watson",
        citations: 312,
      },
      {
        id: "9",
        title: "Personalized Medicine AI",
        description: "AI-driven approaches to individualized treatment plans",
        category: "Healthcare AI",
        date: "2024-12-05",
        author: "Dr. Jennifer Doudna",
        citations: 267,
      },
    ],
    "materials-science": [
      {
        id: "10",
        title: "Room Temperature Superconductor",
        description:
          "Discovery of materials exhibiting superconductivity at ambient conditions",
        category: "Superconductors",
        date: "2024-12-20",
        author: "Dr. Alex Kumar",
        citations: 445,
      },
      {
        id: "11",
        title: "Self-Healing Materials",
        description:
          "Advanced polymers that can repair themselves autonomously",
        category: "Smart Materials",
        date: "2024-12-14",
        author: "Prof. Maria Santos",
        citations: 189,
      },
    ],
    energy: [
      {
        id: "12",
        title: "Fusion Energy Breakthrough",
        description:
          "Scientists achieve net energy gain in nuclear fusion reaction",
        category: "Nuclear Fusion",
        date: "2024-12-22",
        author: "Dr. Robert Kim",
        citations: 523,
      },
      {
        id: "13",
        title: "Perovskite Solar Cell Efficiency",
        description:
          "Record-breaking efficiency in next-generation solar cells",
        category: "Solar Energy",
        date: "2024-12-18",
        author: "Prof. Anna Lee",
        citations: 298,
      },
    ],
    healthcare: [
      {
        id: "14",
        title: "Alzheimer's Treatment Breakthrough",
        description:
          "Clinical trials demonstrate significant cognitive improvement",
        category: "Neurology",
        date: "2024-12-21",
        author: "Dr. Michael Brown",
        citations: 356,
      },
      {
        id: "15",
        title: "Cancer Immunotherapy Advances",
        description:
          "Novel approaches to enhancing immune system response to cancer",
        category: "Oncology",
        date: "2024-12-16",
        author: "Dr. Rachel Green",
        citations: 412,
      },
    ],
  };

  const handleSearch = () => {
    // Search is reactive now, but we can keep this for explicit actions if needed
    console.log("Searching for:", searchQuery);
  };

  const allResearchItems = Object.values(researchData).flat();
  let filteredData: ResearchItem[] = [];

  if (searchQuery.trim()) {
      filteredData = allResearchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  } else if (selectedCategory === "saved-library") {
    // Client-side hydration safety check
    if (typeof window !== "undefined") {
       // We use the state to trigger re-renders, but source of truth for THIS list is localStorage
       // We can just filter all items by savedItemsIds to be safe and reactive
       // Or re-read localStorage. Let's rely on savedItemsIds state which we keep in sync.
       // Actually, let's just use the state we created: savedItemsIds is just IDs.
       // We need the full objects.
       const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]");
       filteredData = saved;
    } else {
       filteredData = [];
    }
  } else {
    filteredData = researchData[selectedCategory] || [];
  }

  const displayTitle = searchQuery.trim() 
    ? `Search Results for "${searchQuery}"`
    : fieldCategories.find((c) => c.id === selectedCategory)?.label || "Research";


  const selectedCategoryData = researchData[selectedCategory] || [];

  return (
    <div className="h-screen overflow-y-hidden flex relative bg-background/50">
      <div className="dark:block hidden fixed inset-0 z-0 pointer-events-none">
        <GeometricBackground variant="orb" />
      </div>
      <NavigationSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="p-6 bg-background border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
                Knowledge Discovery
              </h1>
              <p className="text-muted-foreground text-lg">
                Explore cutting-edge research and breakthrough discoveries
              </p>
            </div>
          </div>

          {/* Search Bar */}
          {/* <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search research papers, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 pr-14 py-4 text-base bg-input border-border transition-fast"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <button
                onClick={handleSearch}
                className="btn-ghost text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              >
                <Mic className="h-4 w-4 text-black" />
              </button>
            </div>
          </div> */}
          <div className="max-w-2xl w-full h-12 px-4 flex items-center gap-3 rounded-lg border border-border bg-input">

            {/* Left Search Icon */}
            <Search className="h-5 w-5 text-muted-foreground" />

            {/* Input */}
            <input
              type="text"
              placeholder="Search research papers, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="
                flex-1
                bg-transparent
                outline-none
                border-none
                text-base
                placeholder:text-muted-foreground
              "
              style={{
                boxShadow: "none",
                WebkitBoxShadow: "none",
                outline: "none",
                border: "none",
              }}

            />

            {/* Right Mic Button */}
            <button
              onClick={handleSearch}
              className="h-8 w-8 flex items-center justify-center hover:text-foreground text-muted-foreground"
            >
              <Mic className="h-4 w-4 text-black" />
            </button>
          </div>

        </div>

        <div className="flex-1 flex">
          {/* Main Content Area */}
          <div className="flex-1 px-8 py-6">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {fieldCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-3 px-4 py-3 transition-fast focus-ring ${isSelected ? "btn-primary" : "btn-secondary"
                      }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }
                    />
                    <span className="font-medium text-sm">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content Display */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                {displayTitle}
              </h2>

              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-6 pr-2">
                  {filteredData.map((item) => (
                    <div key={item.id} className="group" onClick={() => handleSelectItem(item)}>
                      <div className="glass-card hover:bg-muted/40 transition-all cursor-pointer p-0 rounded-2xl border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-lg group-hover:-translate-y-0.5 duration-300">
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {item.category && (
                                    <Badge
                                      variant="secondary"
                                      className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border-transparent h-5"
                                    >
                                      {item.category}
                                    </Badge>
                                  )}
                                  {item.url && <ExternalLink size={12} className="text-muted-foreground opacity-50" />}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                              </div>
                              {/* <button className="btn-ghost text-muted-foreground hover:text-primary h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={18} />
                              </button> */}
                          </div>
                          
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                             {item.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {item.author && (
                                  <div className="flex items-center gap-1.5 has-tooltip">
                                     <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                        {item.author[0]}
                                     </div>
                                     <span className="truncate max-w-[100px]">{item.author}</span>
                                  </div>
                                )}
                                {item.date && (
                                   <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                )}
                             </div>
                             
                             {item.citations && (
                                <div className="flex items-center gap-1 text-xs font-medium text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                   <Star size={10} className="fill-current" />
                                   <span>{item.citations}</span>
                                </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Sidebar - Category Navigation */}
          <div className="w-64 bg-background/40 backdrop-blur-xl border-l border-border/50 p-6 relative z-10 flex flex-col h-full">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Research Categories
            </h3>
            <div className="space-y-2">
              {sidebarCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all duration-200 group ${isSelected
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "bg-card/50 hover:bg-card hover:border-primary/20 text-foreground border border-transparent"
                      }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-primary-foreground' : category.dotColor} flex-shrink-0`}
                    ></div>
                    <Icon
                      size={18}
                      className={
                        isSelected
                          ? "text-primary-foreground"
                          : "text-primary"
                      }
                    />
                    <span className="font-medium text-sm flex-1">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Custom Modal for Details */}
      {selectedItem && !showPDFViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
              className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity" 
              onClick={() => handleSelectItem(null)}
          />
          <div className="relative w-full max-w-4xl bg-card/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
             
             {/* Modal Header Image/Gradient Placeholder */}
             <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background relative border-b border-border/50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 rounded-full bg-background/20 hover:bg-background/40 text-foreground"
                    onClick={() => handleSelectItem(null)}
                >
                    <X size={18} />
                </Button>
                <div className="absolute bottom-6 left-8">
                    <Badge variant="outline" className="bg-background/50 backdrop-blur text-foreground border-border">
                        {selectedItem.category}
                    </Badge>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 pt-6">
                 <div className="flex items-start justify-between gap-6 mb-6">
                     <h2 className="text-3xl font-bold text-foreground leading-tight">
                        {selectedItem.title}
                     </h2>
                     {selectedItem.date && (
                        <div className="text-right shrink-0">
                           <div className="text-sm font-medium text-muted-foreground">Published</div>
                           <div className="text-sm text-foreground font-mono">{new Date(selectedItem.date).toLocaleDateString()}</div>
                        </div>
                     )}
                 </div>

                 <div className="flex items-center gap-6 pb-8 border-b border-border/40 mb-8">
                     {selectedItem.author && (
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {selectedItem.author[0]}
                           </div>
                           <div>
                              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Author</div>
                              <div className="font-semibold text-foreground">{selectedItem.author}</div>
                           </div>
                        </div>
                     )}
                     {selectedItem.citations && (
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Star size={18} className="fill-current" />
                           </div>
                           <div>
                              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Impact</div>
                              <div className="font-semibold text-foreground">{selectedItem.citations} Citations</div>
                           </div>
                        </div>
                     )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                       <div className="prose dark:prose-invert max-w-none">
                          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                             <Sparkles size={16} className="text-primary" />
                             Abstract
                          </h3>
                          <p className="text-muted-foreground leading-relaxed text-lg">
                             {selectedItem.description}
                          </p>
                          <p className="text-muted-foreground/60 text-sm mt-4 italic">
                             Full content access requires subscription or institutional login. This preview is generated from open metadata.
                          </p>
                       </div>

                       <div className="flex gap-3 pt-4">
                          <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold" onClick={() => setShowPDFViewer(true)}>
                             <BookOpen size={18} className="mr-2" /> 
                             Read Paper
                          </Button>
                          <Button size="lg" variant="secondary" className="flex-1 bg-secondary/50 hover:bg-secondary/70" onClick={() => handleSavePaper(selectedItem)}>
                             <Bookmark size={18} className={`mr-2 ${savedItemsIds.includes(selectedItem.id) ? "fill-current text-purple-500" : ""}`} />
                             {savedItemsIds.includes(selectedItem.id) ? "Remove" : "Save Library"}
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
                             <h4 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                                <Zap size={14} className="text-yellow-500" />
                                Key Concepts
                             </h4>
                             <div className="flex flex-wrap gap-2">
                                {["Neural Networks", "Optimization", "Algorithms", "Data Efficiency"].map(tag => (
                                   <Badge key={tag} variant="secondary" className="bg-background/80 hover:bg-background transition-colors cursor-default">
                                      {tag}
                                   </Badge>
                                ))}
                             </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
                             <h4 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                                <DollarSign size={14} className="text-green-500" />
                                Funding
                             </h4>
                             <p className="text-xs text-muted-foreground">
                                Supported by <span className="text-foreground font-medium">National Science Foundation</span> grant #2024-AI-992.
                             </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-10 border-border/50" onClick={() => handleShare(selectedItem)}>
                                <Share2 size={14} />
                            </Button>
                            <Button variant="outline" className="flex-1 h-10 border-border/50" onClick={() => handleQuote(selectedItem)}>
                                <Quote size={14} />
                            </Button>
                        </div>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Overlay */}
      {showPDFViewer && selectedItem && (
        <div className="fixed inset-0 z-[200] bg-background">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">{selectedItem.title}</h3>
                <Button variant="ghost" onClick={() => setShowPDFViewer(false)}>Close</Button>
            </div>
            <div className="h-[calc(100vh-64px)]">
               <PDFViewer fileUrl={selectedItem.url || "https://pdftron.s3.amazonaws.com/downloads/pl/demo-annotated.pdf"} />
            </div>
        </div>
      )}
    </div>
  );
}
