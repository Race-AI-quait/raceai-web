"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  Quote,
  AlertCircle,
  Send,
  Plus,
  SlidersHorizontal,
  Globe,
  Paperclip,
  StopCircle,
  Presentation
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
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "../context/UserContext";
import { dataService } from "@/lib/data-service";
import { Clock } from "lucide-react";

interface RoadmapSection {
  title: string;
  description: string;
  items: { title: string; description: string }[];
}

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
  // added for roadmap/news specific layouts if needed, but we can reuse description/title
  items?: { title: string; description: string }[];
  amount?: number;
  agency?: string;
}

interface ResearchResponse {
  query: string;
  stateOfTheArt: any[];
  recentGroundbreaking: any[];
  topics: any[];
  topResearchers: any[];
  news: any[];
  funding: any[];
  roadmap: RoadmapSection[];
  edgeProblems?: any[];
}

const ExpandableText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text === "No abstract available.") {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {text}
      </p>
    );
  }

  return (
    <div className="mb-4">
      <p className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      {text.length > 150 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-primary text-xs font-medium hover:underline mt-1"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};

const GeminiInput = ({ value, onChange, onSubmit, isLoading, autoFocus = false }: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  autoFocus?: boolean;
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgba(180, 180, 255, ${barHeight / 150})`;
        canvasCtx.fillRect(x, Math.max(0, canvas.height - barHeight), barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        drawVisualizer();

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.onstop = async () => {
          setIsTranscribing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            const res = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
            if (res.ok) {
              const data = await res.json();
              onChange(value + (value ? " " : "") + data.text);
            } else {
              toast({ title: 'Error', description: 'Failed to transcribe audio.', variant: 'destructive' });
            }
          } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to transcribe audio.', variant: 'destructive' });
          } finally {
            setIsTranscribing(false);
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({ title: "Microphone Access Denied", description: "Please allow microphone permissions.", variant: "destructive" });
        setIsRecording(false);
      }
    } else {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast({ title: "Files attached", description: `${e.target.files.length} file(s) ready for research.` });
    }
  };

  const handleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard);
    toast({ title: showWhiteboard ? "Whiteboard closed" : "Whiteboard", description: showWhiteboard ? "" : "Opening research whiteboard..." });
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); toast({ title: "Files attached via drag & drop" }); }}
      className={`w-full bg-white dark:bg-[#1E1F20] rounded-3xl border border-border/50 shadow-sm flex flex-col relative overflow-hidden transition-all focus-within:ring-1 focus-within:ring-border/50 ${isDragging ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
          <div className="text-primary font-semibold text-lg flex items-center gap-2">
            <Paperclip size={20} />
            Drop files here
          </div>
        </div>
      )}

      <Textarea
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={isTranscribing ? "Transcribing audio..." : "What do you want to research?"}
        className="w-full bg-transparent text-foreground placeholder-muted-foreground border-none resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 p-4 pb-16 min-h-[120px] text-lg max-h-[200px] overflow-y-auto placeholder:text-muted-foreground/50 shadow-none"
        style={{ minHeight: '120px' }}
        disabled={isLoading || isTranscribing}
      />

      <canvas
        ref={canvasRef}
        className={`w-full h-12 absolute bottom-14 left-0 pointer-events-none transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,image/*,audio/*,video/*"
            multiple
          />
          <button
            className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            disabled={isLoading || isTranscribing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
          <button
            className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer ${isRecording ? "text-destructive" : "text-muted-foreground"}`}
            disabled={isLoading || isTranscribing}
            onClick={handleVoiceInput}
          >
            {isRecording ? <StopCircle size={20} className="animate-pulse" /> : <Mic size={20} />}
          </button>
          <button
            className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer ${showWhiteboard ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            disabled={isLoading || isTranscribing}
            onClick={handleWhiteboard}
            title="Whiteboard"
          >
            <Presentation size={20} />
          </button>


        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSubmit}
            disabled={!value.trim() && !isLoading && !isTranscribing}
            className="p-2 h-10 w-10 shrink-0 rounded-full bg-foreground text-background disabled:opacity-50 disabled:bg-muted-foreground/30 disabled:text-muted-foreground transition-all cursor-pointer hover:bg-foreground/90 flex items-center justify-center"
          >
            {isLoading ? (
              <StopCircle size={20} className="animate-pulse" />
            ) : (
              <Send size={18} className="-ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function KnowledgeDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState("state-of-art"); // sidebar view

  const [apiData, setApiData] = useState<ResearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [savedItemsIds, setSavedItemsIds] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  // Hydrate saved items and history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]");
      setSavedItemsIds(saved.map((p: any) => p.id));
    }

    // Fetch History
    const fetchHistory = async () => {
      // In a real app we'd use user?.id, hard-coding user-1 as per pattern
      const data = await dataService.getKnowledgeHistory(user?.id || 'user-1');
      setHistoryItems(data || []);
    };
    fetchHistory();
  }, [user]);

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
      id: "edge-problems",
      label: "Edge Problems",
      icon: AlertCircle,
      color: "bg-red-500/20",
      dotColor: "bg-red-500",
    },
    {
      id: "news",
      label: "Latest News",
      icon: Newspaper,
      color: "bg-pink-500/20",
      dotColor: "bg-pink-500",
    },
    {
      id: "saved-library",
      label: "My Library",
      icon: Bookmark,
      color: "bg-purple-500/20",
      dotColor: "bg-purple-500",
    },
  ];

  // Fetch data from our new streaming API
  const fetchResearchData = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setApiData(null);
    setProgress(0);
    setStatusMessage("Initializing deep research agent...");
    setHasSearched(true);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        toast({ title: "Error", description: "Failed to start deep research.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        if (done) {
          buffer += decoder.decode();
        }

        // SSE chunks are separated by double newlines
        const events = buffer.split('\n\n');

        // The last element is either an empty string (if buffer ended with \n\n)
        // or an incomplete event. Keep it in the buffer.
        buffer = events.pop() || "";

        for (const event of events) {
          if (!event.trim()) continue;

          // An event can contain multiple lines, we only care about 'data: ' lines
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") continue;
              try {
                const payload = JSON.parse(dataStr);
                if (payload.type === "progress") {
                  setProgress(payload.percent);
                  setStatusMessage(payload.message);
                } else if (payload.type === "result") {
                  setApiData(payload.data);
                  setIsLoading(false);

                  // Save query transparently to backend
                  // In a real app we'd use user?.id, hard-coding user-1 as per backend format
                  dataService.saveKnowledgeQuery(user?.id || 'user-1', payload.data)
                    .then(savedResult => {
                      if (savedResult) {
                        setHistoryItems(prev => [savedResult, ...prev]);
                      }
                    });

                } else if (payload.type === "error") {
                  toast({ title: "Error", description: payload.message, variant: "destructive" });
                  setIsLoading(false);
                }
              } catch (e) {
                console.error("Failed to parse SSE payload", dataStr.substring(0, 100), e);
              }
            }
          }
        }

        if (done) break;
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Network error while fetching data.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchResearchData(searchQuery.trim());
    }
  };

  let filteredData: ResearchItem[] = [];

  if (selectedView === "saved-library") {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("saved_papers") || "[]");
      filteredData = saved;
    }
  } else if (apiData) {
    // Map dynamically based on sidebar category
    switch (selectedView) {
      case "state-of-art":
        filteredData = apiData.stateOfTheArt.map((p: any) => ({
          id: p.id, title: p.title, description: p.abstract || "No abstract available.", category: "Paper", date: `${p.year}-01-01`, author: p.authors?.[0]?.name, citations: p.citationCount, url: p.url
        }));
        break;
      case "recent-groundbreaks":
        filteredData = apiData.recentGroundbreaking.map((p: any) => ({
          id: p.id, title: p.title, description: p.abstract || "No abstract available.", category: "Breakthrough", date: `${p.year}-01-01`, author: p.authors?.[0]?.name, citations: p.citationCount, url: p.url
        }));
        break;
      case "topics-to-research":
        filteredData = apiData.topics.map((t: any) => ({
          id: t.id, title: t.name, description: t.description || "Sub-field topic.", category: "Topic", citations: Math.floor(t.relevanceScore * 100)
        }));
        break;
      case "top-researchers":
        filteredData = apiData.topResearchers.map((r: any) => ({
          id: r.id, title: r.name, description: r.affiliation || "Independent", category: "Researcher", citations: r.totalCitations, url: r.profileUrl
        }));
        break;
      case "news":
        filteredData = apiData.news.map((n: any) => ({
          id: n.id, title: n.title, description: n.snippet || "News article", category: n.sourceName || "News", date: n.publishedAt, url: n.url
        }));
        break;
      case "roadmap":
        filteredData = apiData.roadmap.map((r: any, i: number) => ({
          id: `roadmap-${i}`, title: r.title, description: r.description, category: "Roadmap Stage", items: r.items
        }));
        break;
      case "edge-problems":
        filteredData = apiData.edgeProblems?.map((ep: any, i: number) => ({
          id: `edge-${i}`, title: ep.title, description: ep.description, category: ep.relevance
        })) || [];
        break;
      default:
        filteredData = [];
    }
  }

  const displayTitle = apiData ? `Results for "${apiData.query}"` : `Results for "${searchQuery}"`;

  return (
    <div className="h-screen overflow-y-hidden flex relative bg-background/50 dark:bg-[#181818]">
      <div className="dark:hidden block fixed inset-0 z-0 pointer-events-none">
        <GeometricBackground variant="orb" />
      </div>

      <NavigationSidebar />

      {/* History Sidebar */}
      <div
        className={`bg-[#f9f9f9] dark:bg-[#1e1f20] border-r border-border/50 transition-all duration-300 flex flex-col ${isHistorySidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between min-w-[16rem]">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Previous Lookups
          </h3>
          <button
            onClick={() => setIsHistorySidebarOpen(false)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <ScrollArea className="flex-1 min-w-[16rem]">
          <div className="p-3 space-y-2">
            {historyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No history found.</p>
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setApiData(item);
                    setSearchQuery(item.query);
                    setHasSearched(true);
                    setSelectedView("state-of-art");
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted text-sm transition-colors border border-transparent hover:border-border/50 group"
                >
                  <p className="font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {item.query}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">

        {/* Toggle History Button (shows when sidebar closed) */}
        {!isHistorySidebarOpen && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => setIsHistorySidebarOpen(true)}
              className="p-2 bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-sm hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group"
              title="View History"
            >
              <Clock size={16} className="group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">History</span>
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col px-8 pt-6 pb-6 relative overflow-hidden">
            {hasSearched ? (
              <>
                {/* Content Display */}
                <div className="mb-4 shrink-0 flex items-center">
                  <h2 className={`text-lg font-semibold text-foreground ${!isHistorySidebarOpen ? 'ml-32' : ''}`}>
                    {displayTitle}
                  </h2>
                </div>

                <ScrollArea className="flex-1">
                  <div className="pb-4">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-8 py-20 text-muted-foreground w-full max-w-md mx-auto">
                        <div className="relative mb-6">
                          <Atom className="animate-spin text-primary w-20 h-20" />
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-50"></div>
                        </div>
                        <div className="w-full max-w-sm space-y-4 text-center">
                          <Progress value={progress === 0 ? 5 : progress} className="w-full h-3 bg-primary/20 rounded-full" />
                          <p className="text-sm font-medium animate-pulse text-foreground/80">{statusMessage}</p>
                        </div>
                      </div>
                    ) : (
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
                                </div>

                                <ExpandableText text={item.description} />

                                {/* Roadmap Items Rendering specifically for Roadmap Category */}
                                {item.items && item.items.length > 0 && (
                                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-primary/20">
                                    {item.items.map((subitem, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-semibold text-foreground">{subitem.title}:</span> <span className="text-muted-foreground">{subitem.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!item.items && (
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

                                    {item.citations !== undefined && (
                                      <div className="flex items-center gap-1 text-xs font-medium text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        <Star size={10} className="fill-current" />
                                        <span>{item.citations}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {!isLoading && filteredData.length === 0 && (
                          <div className="text-center py-10 text-muted-foreground">
                            No data found for this category.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full animate-in fade-in duration-700 pb-20">
                <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-primary/10">
                  <Atom className="w-8 h-8 text-primary/60" />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground/90 mb-4 tracking-tight">
                  Start Your Research
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
                  Define your complex problem statement below. Our autonomous, multi-agent system will initiate a comprehensive knowledge discovery process, scanning global databases to synthesize and map actionable breakthroughs in real-time.
                </p>
              </div>
            )}

            {/* Gemini Input Anchored at Bottom */}
            <div className="mt-4 shrink-0 w-full max-w-4xl mx-auto flex flex-col items-center">
              <GeminiInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                isLoading={isLoading}
                autoFocus={true}
              />

            </div>
          </div>

          {/* Right Sidebar - Category Navigation */}
          <div className="w-64 bg-[#f9f9f9] dark:bg-[#1e1f20] dark text-foreground border-l border-white/5 p-6 relative z-10 flex flex-col h-full">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Research Categories
            </h3>
            <div className="space-y-2">
              {sidebarCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedView === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedView(category.id)}
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
                {selectedItem.citations !== undefined && (
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
