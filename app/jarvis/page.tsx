"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Block } from "@/app/types/blocks";


import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import GeometricBackground from "@/components/geometric-background";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Mic,
  Paperclip,
  Settings,
  Download,
  Share,
  RefreshCw,
  Trash2,
  Pin,
  PinOff,
  Search,
  Filter,
  Plus,
  Loader2,
  ExternalLink,
  X,
  Calendar,
  Edit3,
  Users,
  Link,
  Monitor,
  Presentation,
  Map,
  BookOpen,
  Sparkles,
  FileText,
  MessageSquare,
  ArrowUpRight,
  Share2,
  Upload,
  User,
  Zap,
  Folder,
  Clock,
  MoreVertical,
  Edit2,
  ArrowUp,
  Copy,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Grid,
  List,
  Brain,
  PlusCircle,
  BookOpenCheck,
  LayoutGrid,
  Bot
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; 
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation"; 
import { StopCircle } from "lucide-react";
import Logo2D from "@/components/logo-2d";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

if (typeof window !== 'undefined') {
  // Use CDN for worker to avoid build/version mismatch issues with local file
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
}
import ModernLogo from "@/components/modern-logo";
import NavigationSidebar from "@/components/navigation-sidebar";
import { LLM_PROVIDERS, getModelById } from "@/lib/llm-providers";

import { SimpleThemeToggle } from "@/components/theme-toggle";
import Markdown from "@/components/Markdown";
import { useProjects } from "@/app/context/ProjectContext";
import BlockRenderer from "@/components/BlockRenderer";
import Whiteboard from "@/components/Whiteboard";
import ScreenShareOverlay from "@/components/ScreenShareOverlay";
import { ChatProvider } from "../context/ChatContext";
import { useChatContext, ChatSession as ContextChatSession } from "../context/ChatContext";
import { useToast } from "@/components/ui/use-toast";
import JarvisThinking from "@/components/jarvis-thinking";

const CleanBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-aurora">{children}</div>
);



interface Message {
  id: string;
  content?: string;
  sender: "user" | "assistant" | "collaborator";
  senderName?: string;
  timestamp: Date;
  resources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  blocks?: Block[];
}

interface LocalChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  createdAt: Date;
  updatedAt?: Date | string;
  projectId?: string;
  isPinned?: boolean;
  category: "recent" | "pinned" | "project";
  projectName?: string;
  topic?: string;
  model?: string;
  messages?: any[];
  collaborators?: string[];
}

interface FilterState {
  searchText: string;
  dateRange: { from: Date | null; to: Date | null };
  category: string;
  topic: string;
}

interface ChatAction {
  type: "rename" | "share" | "save" | "delete";
  chatId: string;
}

interface ShareOptions {
  type: "external" | "collaborator";
  link?: string;
  collaboratorEmail?: string;
}

interface ProjectSave {
  projectName: string;
  folderName?: string;
}

export default function JarvisPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]); // Init empty for hydration match
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [activeTab, setActiveTab] = useState<
    "recent" | "pinned" | "project" | "shared"
  >("recent");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showCollaboratorInput, setShowCollaboratorInput] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const { setIsGenerating } = useChatContext();

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Sync loading state to global context for logo animation
  useEffect(() => {
    setIsGenerating(isLoading);
  }, [isLoading, setIsGenerating]);
  
  // Navigation Handler
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
      const sessionIdFromUrl = searchParams.get('sessionId');
      if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
          handleSelectSession(sessionIdFromUrl);
      }
  }, [searchParams]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsLoading(false);
          toast({ title: "Stopped", description: "Generation stopped by user." });
      }
  };

  const handleEditMessage = (content: string) => {
      setInputMessage(content);
      if (fileInputRef.current) {
          fileInputRef.current.focus(); // Focus input area (using file ref proxy or ideally input ref)
      }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEditing = (message: Message) => {
      setEditingMessageId(message.id);
      let initialContent = message.content || "";
      if (!initialContent && message.blocks) {
          initialContent = message.blocks
              .filter(b => b.type === 'paragraph' && 'text' in b)
              .map(b => (b as any).text)
              .join("\n");
      }
      setEditContent(initialContent);
  };

  const cancelEditing = () => {
      setEditingMessageId(null);
      setEditContent("");
  };

  const submitEdit = async (messageId: string, newContent: string) => {
       // 1. Calculate new state immediately
       const index = messages.findIndex(m => m.id === messageId);
       if (index === -1) return;
       
       const truncated = messages.slice(0, index);
       const updatedMessage: Message = {
           ...messages[index],
           content: newContent,
           blocks: [{ type: "paragraph", text: newContent }], // Force update blocks to reflect content
           timestamp: new Date()
       };
       const updatedMessages = [...truncated, updatedMessage];
       
       // Update UI
       setMessages(updatedMessages);

       setEditingMessageId(null);
       setEditContent("");
       setIsLoading(true);

       // 2. Trigger Title Regeneration if First Message was edited
       // Now updatedMessages is valid in this scope
       const isFirstMessage = index === 0;
       if (isFirstMessage && currentSessionId) {
            // Async fire-and-forget
            fetchTitleFromAI(currentSessionId, newContent);
       }

       // 3. Trigger API to get new response based on truncated history + new prompt
       try {
        // Find current custom instructions
        const activeAgent = [...agents, ...customAgents].find(a => a.id === selectedAgent);
        let systemInstruction = (activeAgent as any)?.instructions || undefined;
        // Check if agent allows links
        const agentIncludeLinks = (activeAgent as any)?.includeLinks ?? true;

        // Inject Knowledge Base if available
        if (knowledgeBase) {
             const kbPrompt = `\n\n[KNOWLEDGE BASE]\nUse the following information to answer user questions:\n${knowledgeBase}\n[END KNOWLEDGE BASE]`;
             systemInstruction = systemInstruction ? `${systemInstruction}${kbPrompt}` : `You are a helpful AI assistant.${kbPrompt}`;
        }
           
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Prepare message history for API (excluding the one we just simulated adding, 
        // effectively we are resending the *updated* history up to the point of edit)
        // Actually, we need to send the truncated history + the new user message content.
        const historyForApi = updatedMessages.map((msg) => ({
             sender: msg.sender,
             content: msg.content || "" // Simplified for edit re-generation
        }));

        const response = await fetch("/api/chat", {
          signal: controller.signal,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForApi,
            model: selectedModel,
            includeResources: agentIncludeLinks && true,
            systemInstruction
          }),
        });

        if (!response.ok) throw new Error("Failed to regenerate response");
        
        const data = await response.json();
        if (!data) return;

        const assistantMessage: Message = {
            id: data.message.id,
            blocks: data.message.blocks,
            sender: "assistant",
            timestamp: new Date(),
            resources: data.message.resources,
        };

        setMessages(prev => [...prev, assistantMessage]); // Append AI response to the truncated list
        
       } catch (error) {
           console.error("Error regenerating chat:", error);
           toast({ title: "Error", description: "Failed to regenerate response.", variant: "destructive" });
       } finally {
           setIsLoading(false);
       }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    dateRange: { from: null, to: null },
    category: "",
    topic: "",
  });

  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [showChatActions, setShowChatActions] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState<string | null>(null);
  const { chatSessions, setChatSessions, updateSession } = useChatContext();
  const { projects, addChatToProject, addProject } = useProjects();
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [chatTitles, setChatTitles] = useState<Record<string, string>>({});
  const [deletedChats, setDeletedChats] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Agent & Training State
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentInstructions, setNewAgentInstructions] = useState("");
  const [newAgentIncludeLinks, setNewAgentIncludeLinks] = useState(true);
  const [customAgents, setCustomAgents] = useState<Array<{id: string, name: string, instructions: string, includeLinks: boolean}>>([]);
  const [resoucesToTrain, setResourcesToTrain] = useState<File[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");

  const agents = [
    { id: "general", name: "General Assistant", icon: Bot },
    { id: "lit-review", name: "Literature Reviewer", icon: BookOpen },
    { id: "data-analyst", name: "Data Analyst", icon: LayoutGrid }, // utilizing generic icon fallback if not imported
  ];

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return;
    
    if (editingChatId) { // Reusing state variable temporarily or create new one? 
        // Let's create a dedicated state for editing agent ID if needed, 
        // but for now let's just use a new logic:
        setCustomAgents(prev => prev.map(a => a.id === editingAgentId ? { ...a, name: newAgentName, instructions: newAgentInstructions, includeLinks: newAgentIncludeLinks } : a));
        setEditingAgentId(null);
        toast({ title: "Agent Updated", description: `${newAgentName} has been updated.` });
    } else {
        setCustomAgents(prev => [...prev, {
            id: `custom-${Date.now()}`,
            name: newAgentName,
            instructions: newAgentInstructions,
            includeLinks: newAgentIncludeLinks
        }]);
        toast({ title: "Agent Created", description: `${newAgentName} is ready to help.` });
    }
    setShowCreateAgentModal(false);
    setNewAgentName("");
    setNewAgentInstructions("");
    setNewAgentIncludeLinks(true);
  };

  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const startEditingAgent = (agentId: string) => {
      const agent = customAgents.find(a => a.id === agentId);
      if (agent) {
          setNewAgentName(agent.name);
          setNewAgentInstructions(agent.instructions);
          setNewAgentIncludeLinks(agent.includeLinks ?? true);
          setEditingAgentId(agentId);
          setShowCreateAgentModal(true);
      }
  };

  const handleTrainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
          setResourcesToTrain(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const startTraining = async () => {
      setIsLoading(true);
      try {
          // Process all files in resourcesToTrain
          const texts = await Promise.all(resoucesToTrain.map(async (file) => {
              if (file.type === 'application/pdf') {
                  return await extractTextFromPDF(file);
              } else if (file.type.startsWith('text/') || file.name.match(/\.(md|json|js|ts|tsx|csv|txt)$/)) {
                   return await file.text();
              }
              return "";
          }));
          
          const combinedKnowledge = texts.filter(t => t).join("\n\n");
          setKnowledgeBase(prev => prev + "\n" + combinedKnowledge);
          
          setShowTrainModal(false);
          setResourcesToTrain([]);
          toast({ title: "Training Complete", description: "Documents ingested. I can now answer questions based on this knowledge." });
      } catch (error) {
          console.error("Training Error:", error);
          toast({ title: "Training Failed", description: "Could not process some files.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  };

  const mapContextMessageToLocal = (msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    sender: (msg.role === "USER" || msg.role === "user") ? "user" : "assistant",
    timestamp: new Date(msg.createdAt),
    blocks: [{ type: "paragraph", text: msg.content }],
  });

  const mapContextSessionToLocal = (session: ContextChatSession): LocalChatSession => {
    let preview = "No messages";
    if (session.messages?.length > 0) {
      const rawContent = session.messages[session.messages.length - 1].content || "";
      // Clean Markdown
      const cleanContent = rawContent.replace(/[#*`]/g, "").trim();
      // Replace newlines with hyphen
      const oneLine = cleanContent.replace(/\n+/g, " - ");
      // Capitalize
      preview = oneLine.charAt(0).toUpperCase() + oneLine.slice(1);
      // Truncate
      if (preview.length > 100) preview = preview.slice(0, 100) + "...";
    }

    return {
      id: session.id,
      title: session.title || "New Chat",
      preview: preview,
      timestamp: new Date(session.updatedAt || session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt || session.createdAt),
      isPinned: session.isPinned,
      category: session.isPinned ? "pinned" : "recent", // Simple logic for now
      projectName: projects.find(p => p.id === session.projectId)?.name || undefined, // Map ID to Name
    };
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      const mappedMessages = session.messages?.map(mapContextMessageToLocal) || [];
      setMessages(mappedMessages);
      // Reset input content and attachments
      setInputMessage("");
      setUploadedFiles([]);
    }
  };



  const getFilteredSessions = () => {
    const localSessions = chatSessions.map(mapContextSessionToLocal);
    return localSessions.filter((session: LocalChatSession) => {
      // Filter out deleted chats
      if (deletedChats.includes(session.id)) {
        return false;
      }

      // Text search filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(searchLower);
        const matchesPreview = session.preview
          .toLowerCase()
          .includes(searchLower);
        const matchesProject = session.projectName
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesTitle && !matchesPreview && !matchesProject) return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const sessionDate = new Date(session.createdAt);
        if (filters.dateRange.from && sessionDate < filters.dateRange.from)
          return false;
        if (filters.dateRange.to && sessionDate > filters.dateRange.to)
          return false;
      }

      // Category filter
      if (
        filters.category &&
        !session.category.toLowerCase().includes(filters.category.toLowerCase())
      ) {
        return false;
      }

      // Topic filter
      if (
        filters.topic &&
        session.topic &&
        !session.topic.toLowerCase().includes(filters.topic.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  };

  const handleNewChat = () => {
    // Create a new chat session
    const newSessionId = Date.now().toString();
    const welcomeMessage = {
      id: "1",
      content: "Welcome to JARVIS Chat! How can I assist with your research today?",
      sender: "assistant",
      timestamp: new Date(),
      role: "ASSISTANT", // For context compatibility
      createdAt: new Date().toISOString(),
    };

    const newSession: any = {
      id: newSessionId,
      title: "New Chat",
      preview: "Start a new conversation...",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: "recent",
      messages: [welcomeMessage], // Initialize with welcome message
      userId: 'user',
      isSaved: true,
      projectId: '',
      isPinned: false,
      collaborators: []
    };

    // Add new session to the beginning of the list
    setChatSessions([newSession as unknown as ContextChatSession, ...chatSessions]);

    // Set as current session
    setCurrentSessionId(newSessionId);

    // Reset messages
    setMessages([welcomeMessage as unknown as Message]);
    setInputMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChatTitle = (userMessage: string): string => {
    // Heuristic: Remove conversational filler and extract topic
    const stopWords = new Set([
      "hey", "hi", "hello", "jarvis", "please", "can", "could", "would", "you",
      "write", "explain", "tell", "me", "about", "what", "how", "why", "is", "a", "an", "the",
      "help", "with", "create", "make", "generate", "code"
    ]);

    const cleanMessage = userMessage.trim().replace(/[^\w\s]/gi, ''); // Remove punctuation
    const words = cleanMessage.split(/\s+/);

    // Filter out stop words (case insensitive)
    const topicWords = words.filter(w => !stopWords.has(w.toLowerCase()));

    // Sort of overly aggressive? If nothing is left (e.g. "Hi how are you"), use original words.
    // If we have some topic words, use the first 3-4 of them.
    const finalWords = topicWords.length > 0 ? topicWords.slice(0, 4) : words.slice(0, 4);

    // Title Case
    const title = finalWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      // Limit to first 10 pages to avoid huge payloads for now, or just read all if reasonable
      const maxPages = Math.min(pdf.numPages, 10); 
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(" ") + "\n";
      }
      if (pdf.numPages > 10) {
          text += "\n...[Content truncated for length]...";
      }
      return text;
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      return "Error extracting text from PDF.";
    }
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Process files
    // Process files
    const processedFiles = await Promise.all(uploadedFiles.map(async (file) => {
      // Handle PDF with direct extraction (async)
      if (file.type === 'application/pdf') {
         const textContent = await extractTextFromPDF(file);
         return { type: 'text', content: textContent, mime: file.type } as { type: 'image' | 'text', content: string, mime: string };
      }

      // Handle other files with FileReader
      return new Promise<{ type: 'image' | 'text', content: string, mime: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (file.type.startsWith('image/')) {
            resolve({ type: 'image', content: result, mime: file.type });
          } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            resolve({ type: 'text', content: result, mime: file.type }); 
          } else {
            // Check if text-readable
            if (file.type.startsWith('text/') || file.name.match(/\.(md|json|js|ts|tsx|csv|txt)$/)) {
              resolve({ type: 'text', content: result, mime: file.type });
            } else {
              resolve({ type: 'text', content: `[Attached File: ${file.name}]`, mime: file.type });
            }
          }
        };

        if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('text/') || file.name.match(/\.(md|json|js|ts|tsx|csv|txt)$/)) {
          reader.readAsText(file);
        } else {
          resolve({ type: 'text', content: `[Attached File: ${file.name}]`, mime: file.type });
        }
      });
    }));

    // Local UI Message
    const userMessage: Message = {
      id: Date.now().toString(),
      blocks: [
        { type: "paragraph", text: inputMessage },
        // Blocks will be populated by processedFiles loop below
      ],
      sender: "user",
      timestamp: new Date(),
    };

    // Check for user messages specifically to ignore welcome messages
    const isFirstUserMessage = messages.filter(m => m.sender === "user").length === 0;
    const userMessageContent = inputMessage;

    // Add Multimedia Blocks locally
    processedFiles.forEach(f => {
      if (f.type === 'image') {
        userMessage.blocks!.push({ type: "image", url: f.content, alt: "User Upload" });
      } else if (f.mime.startsWith('audio/')) {
        userMessage.blocks!.push({ type: "audio", url: f.content });
      } else if (f.mime.startsWith('video/')) {
        userMessage.blocks!.push({ type: "video", url: f.content });
      } else if (f.mime.startsWith('application/pdf') || f.type === 'text') {
        // If we have content (text), we might display it differently, but for now treating PDF as file download
        // For text files we read, we don't necessarily need a 'file' block if we injected logic, 
        // but user might want to see the file icon.
        const filename = uploadedFiles.find(uf => uf.type === f.mime || (f.mime === 'text/plain' && uf.name.endsWith('.txt')))?.name || "Attached File";
        userMessage.blocks!.push({ type: "file", url: f.content, name: filename, size: "File" });
      }
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Construct API Content - Multimodal
      const apiContent: any[] = [];

      // 1. Add Text
      if (inputMessage) apiContent.push({ type: "text", text: inputMessage });

      // 2. Add processed files
      processedFiles.forEach(f => {
        if (f.type === 'image') {
          apiContent.push({ type: "image", image: f.content });
        } else if (f.type === 'text') {
           const isPDF = f.mime === 'application/pdf';
           const label = isPDF ? `PDF Content (${uploadedFiles.find(uf => uf.type === f.mime)?.name || "Document"})` : (f.content.startsWith('[Attached') ? '' : 'Attached content');
           // Provide extracted text to LLM
           apiContent.push({ type: "text", text: `\n\n--- ${label} ---\n${f.content}\n--- End File ---\n` });
        }
      });

        // Find current custom instructions
        const activeAgent = [...agents, ...customAgents].find(a => a.id === selectedAgent);
        let systemInstruction = (activeAgent as any)?.instructions || undefined;
        // Check if agent allows links (default true for system agents, Check custom agent prop)
        const agentIncludeLinks = (activeAgent as any)?.includeLinks ?? true;

        // Inject Knowledge Base if available
        if (knowledgeBase) {
             const kbPrompt = `\n\n[KNOWLEDGE BASE]\nUse the following information to answer user questions:\n${knowledgeBase}\n[END KNOWLEDGE BASE]`;
             systemInstruction = systemInstruction ? `${systemInstruction}${kbPrompt}` : `You are a helpful AI assistant.${kbPrompt}`;
        }


        
        // Setup AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch("/api/chat", {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...messages.slice(-20).map((msg) => {
                 // Correctly map history for context, preserving layout and modality
                 let content: any = "";
                 if (msg.sender === "user") {
                     // Check if it has blocks to support multimodal history
                     if (msg.blocks && msg.blocks.length > 0) {
                        const contentBlocks: any[] = [];
                        msg.blocks.forEach(b => {
                            if (b.type === 'paragraph') {
                                contentBlocks.push({ type: 'text', text: b.text });
                            } else if (b.type === 'image') {
                                // Re-send image data for context visibility
                                contentBlocks.push({ type: 'image', image: b.url });
                            }
                            // File/Audio/Video might be handled as text description for now if not natively supported by all providers in history
                            // But for "context", keeping them as text is safer unless we know the model supports them.
                            // For now, let's assume image/text is enough for the user's "spiral" issue.
                        });
                        // Fallback if empty (e.g. only file block which we skipped?)
                         content = contentBlocks.length > 0 ? contentBlocks : (msg.content || "");
                     } else {
                        content = msg.content || "";
                     }
                 } else {
                     // Reconstruct assistant content
                     const textContent = msg.content || "";
                     const blockContent = msg.blocks?.map(b => b.type === 'paragraph' ? b.text : '').join("\n") || "";
                     content = textContent || blockContent;
                 }
                 return {
                    sender: msg.sender,
                    content
                 };
              }),
              {
                sender: "user",
                content: [
                    // Inject historical file context
                     ...messages.slice(0, -20).flatMap(msg => {
                        if (!msg.blocks) return [];
                        return msg.blocks.flatMap(b => {
                            if (b.type === 'file' && 'url' in b && b.url.startsWith('text/')) {
                                // Re-inject text content of old files
                                // Note: We need the actual text, but our block structure for 'file' stores content in 'url' (based on current implementation)?
                                // Wait, in handleSendMessage we pushed: { type: "file", url: f.content, name: filename, size: "File" }
                                // And f.content for text/pdf was the text. So yes, b.url IS the content for text files in our local block logic.
                                // We need to be careful not to reinject huge PDFs repeatedly if tokens are an issue, but user asked to retain them.
                                return [{ type: 'text', text: `\n[Historical File Context: ${b.name}]\n${b.url}\n` }];
                            }
                            return [];
                        });
                     }),
                    ...apiContent
                ]
              }
            ],
            model: selectedModel,
            includeResources: agentIncludeLinks && true, // Logic: Only if agent allows it AND global flag is true (default true)
            systemInstruction // Pass the custom persona prompt + Knowledge Base
          }),
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           console.error("Chat API Error:", response.status, errorData);
           throw new Error(errorData.error || `Failed to get response: ${response.status}`);
        }

        const data = await response.json();

      if (!data) return;

      const assistantMessage: Message = {
        id: data.message.id,
        blocks: data.message.blocks,
        sender: "assistant",
        timestamp: new Date(),
        resources: data.message.resources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update ChatSessions with new messages and title (if applicable)
      setChatSessions((prev) => {
        const sessionExists = prev.some(s => s.id === currentSessionId);
        
        // Define updated messages list shared by both paths
        // Note: We need to reconstruct the messages array to include the new one for title extraction context
        // But the mapping below relies on `messages` closure which is the state BEFORE update + userMessage + assistantMessage
        const updatedMessagesList = [
          ...messages,
          userMessage,
          assistantMessage
        ].map(msg => {
          let content = msg.content || "";
          if (!content && msg.blocks && msg.blocks.length > 0) {
            content = msg.blocks
              .map(block => {
                if ("text" in block) return block.text;
                if ("code" in block) return `\`\`\`${block.language || ''}\n${block.code}\n\`\`\``;
                if ("items" in block) return block.items.map(item => `- ${item}`).join('\n');
                return "";
              })
              .filter(Boolean)
              .join('\n\n');
          }
          return {
            id: msg.id,
            sessionId: currentSessionId,
            senderId: msg.sender === 'user' ? 'USER' : 'ASSISTANT',
            content: content,
            createdAt: msg.timestamp.toISOString(),
            isEdited: false,
            editedAt: "",
            role: (msg.sender === 'user' ? 'USER' : 'ASSISTANT') as "USER" | "ASSISTANT"
          };
        });

        const previewText = userMessageContent.slice(0, 100) + (userMessageContent.length > 100 ? "..." : "");
        const formattedPreview = previewText.charAt(0).toUpperCase() + previewText.slice(1);

        if (sessionExists) {
          return prev.map((session) => {
            if (session.id === currentSessionId) {
              // Extract Title from Assistant Response (Priority 1)
              // OLD: Heuristic regex
              // NEW: We will rely on a background fetch for "Smart Title" in handleSendMessage (see below) if it's new.
              // However, we still need a fallback here or we can just keep the existing logic as a backup.
              // But user specifically wants to fix typos, so we should rely entirely on `extractedTitle` if provided by API, 
              // or generated via separate call. 
              // To avoid waiting, let's trigger the title generation async on the FIRST user message.

              // For now, let's assume session.title is updated via a separate effect or call.
              // BUT to keep it simple: Let's use the `generateChatTitle` (which we will upgrade to use API).
              
              // Actually, I'll update `generateChatTitle` to be async and call it? No, `setChatSessions` is sync.
              // We will fire-and-forget a title update.
              
              let newTitle = session.title;
              const isGenericTitle = session.title === "New Chat" || session.title === "New Session" || session.title === "Hello API";
              
              if ((isFirstUserMessage || isGenericTitle) && session.title !== "Generating...") {
                  // We defer title generation to an effect or just let the previous title stick until update.
                  // See `fetchTitleFromAI` call added below setChatSessions.
                  newTitle = session.title; 
              }

            }
            return session;
          });
        } else {
          // Create New Session (Check-Or-Create Pattern)
          // We will use a temporary title until the API returns
          const newTitle = "New Chat"; 

          const newSession: any = {
            id: currentSessionId,
            title: newTitle,
            preview: formattedPreview,
            timestamp: "Today",
            messages: updatedMessagesList,
            model: selectedModel,
            updatedAt: new Date().toISOString(), // Ensure string format
            createdAt: new Date().toISOString(),
            projectId: null,
            userId: 'user',
            isSaved: true,
            isPinned: false,
            collaborators: []
          };
          return [newSession, ...prev];
        }
      });
      
      // Fire-and-forget Title Generation for new chats
      const isNewChat = messages.length <= 1; // Only welcome message or empty
      if (isNewChat) {
         fetchTitleFromAI(currentSessionId, userMessageContent);
      }

      // //post that assistant response to backend
      // await fetch("http://localhost:5000/chat/message", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     sessionId: currentSessionId,
      //     senderId: "ASSISTANT",
      //     role: "ASSISTANT",
      //     content: assistantMessage.blocks?.[0]?.text || assistantMessage.content || "",
      //   }),
      // });

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        blocks: [
          {
            type: "paragraph",
            text: "I apologize, but I'm having trouble connecting right now. Please try again later."
          }
        ],
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredSessions = getFilteredSessions().filter((session) => {
    if (activeTab === "pinned") {
      return pinnedChats.includes(session.id) || session.isPinned;
    }
    if (activeTab === "recent") {
      return true; // Show all sessions including pinned ones
    }
    if (activeTab === "shared") {
      return false; // TODO: Implement shared sessions filtering
    }
    return session.category === activeTab;
  });

  const allModels = LLM_PROVIDERS.flatMap((provider) =>
    provider.models.map((model) => ({
      ...model,
      providerName: provider.name,
      fullId: model.id,
    }))
  );

  const selectedModelInfo = getModelById(selectedModel);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      console.log(
        "Files selected:",
        newFiles.map((f) => f.name)
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter((file) => {
        // Accept images and common document formats
        const validTypes = [
          "image/",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/markdown",
        ];
        return validTypes.some((type) => file.type.startsWith(type));
      });
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      console.log(
        "Files dropped:",
        newFiles.map((f) => f.name)
      );
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Error", description: "Voice input not supported in this browser.", variant: "destructive" });
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            setIsRecording(true);
        };
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(prev => prev + (prev ? " " : "") + transcript);
        };
        
        recognition.onerror = (event: any) => {
            console.error("Voice error:", event.error);
            setIsRecording(false);
        };
        
        recognition.onend = () => {
            setIsRecording(false);
        };
        
        recognition.start();

      } catch (error) {
        console.error("Error accessing microphone:", error);
         setIsRecording(false);
      }
    } else {
      // Manual stop logic if we wanted, usually handled by 'end' event or stop()
      setIsRecording(false);
    }
  };

  const handleChatAction = (action: ChatAction) => {
    switch (action.type) {
      case "rename":
        const chat = chatSessions.find((c) => c.id === action.chatId);
        if (chat) {
          setEditingChatId(action.chatId);
          setEditingTitle(chatTitles[action.chatId] || chat.title);
        }
        break;
      case "share":
        setShowShareModal(action.chatId);
        break;
      case "save":
        setShowSaveModal(action.chatId);
        break;
      case "delete":
        console.log("Deleting chat:", action.chatId);
        // Remove chat from state
        break;
    }
    setShowChatActions(null);
  };

  const handleInlineRename = (chatId: string) => {
    if (editingTitle.trim()) {
      // Update local state
      setChatTitles((prev) => ({
        ...prev,
        [chatId]: editingTitle,
      }));

      // Update global context so filtering works
      setChatSessions((prev) => prev.map(s =>
        s.id === chatId ? { ...s, title: editingTitle } : s
      ));

      setEditingChatId(null);
      setEditingTitle("");
      toast({ title: "Renamed", description: "Chat title updated." });
    }
  };

  const togglePin = (chatId: string) => {
    setPinnedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleDeleteChat = (chatId: string) => {
    setDeletedChats((prev) => [...prev, chatId]);
    setShowDeleteModal(null);
    
    // If we deleted the current active chat, switch to a new chat or another existing one
    if (currentSessionId === chatId) {
        // Filter from the GLOBAL chatSessions, explicitly excluding the one we just marked for deletion
        // We use mapContextSessionToLocal because chatSessions is a ContextChatSession[]
        const remainingChats = chatSessions
            .map(mapContextSessionToLocal)
            .filter(s => s.id !== chatId && !deletedChats.includes(s.id));
            
        if (remainingChats.length > 0) {
            handleSelectSession(remainingChats[0].id);
        } else {
            // No chats left, forcing a "New Chat" logic is safer than leaving an empty state
            handleNewChat();
        }
    }
    toast({ title: "Chat Deleted", description: "Functionality synced with sidebar." });
  };

  const fetchTitleFromAI = async (sessionId: string, prompt: string) => {
      try {
          const res = await fetch("/api/chat/title", {
              method: "POST",
              body: JSON.stringify({ prompt, model: selectedModel }) // Use selected model or default fast one
          });
          const data = await res.json();
          if (data.title) {
              // Update Session Title
              setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: data.title } : s));
          }
      } catch (err) {
          console.error("Failed to generate title:", err);
      }
  };

  const handleScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      setScreenStream(stream);
      setIsScreenSharing(true);
    } catch (err) {
      console.error("Error sharing screen:", err);
      // User cancelled or ignored
    }
  };

  const handleAttachmentFromTool = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    toast({
      title: "captured content added",
      description: `${file.name} attached.`
    });
  };

  const handleWhiteboard = () => {
    setShowWhiteboard(true);
  };

  const handleShare = (chatId: string, options: ShareOptions) => {
    if (options.type === "external") {
      const shareLink = `${window.location.origin}/shared/${chatId}`;
      navigator.clipboard.writeText(shareLink);
      console.log("Created external share link:", shareLink);

      // Show toast notification
      toast({
        title: "Link Copied",
        description: "Shareable link copied to clipboard.",
      });
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 3000);

    } else if (options.type === "collaborator") {
      // Toggle input view in modal
      setShowCollaboratorInput(true);
    }
  };

  const handleInviteCollaborator = async () => {
    if (collaboratorEmail.trim()) {
      try {
          await fetch("/api/chat/invite", {
              method: "POST",
              body: JSON.stringify({ email: collaboratorEmail, chatId: showShareModal })
          });
          
          setChatSessions(prev => prev.map(s => {
              if (s.id === showShareModal) {
                  const currentCollaborators = (s as any).collaborators || [];
                  return { ...s, collaborators: [...currentCollaborators, collaboratorEmail] };
              }
              return s;
          }));

          toast({
            title: "Invitation Sent",
            description: `Shared chat with ${collaboratorEmail}. They will receive an email shortly.`,
          });
      } catch (e) {
          toast({ title: "Error", description: "Failed to send invite.", variant: "destructive" });
      }
      
      setShowShareModal(null);
      setShowCollaboratorInput(false);
      setCollaboratorEmail("");
    }
  };

  return (
    <div
      className="h-screen flex bg-background dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-[#3b82f640] dark:via-[#0B1120] dark:to-black relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dark:block hidden">
        <GeometricBackground variant="orb" />
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary m-4 rounded-xl pointer-events-none">
          <div className="text-3xl font-bold text-primary flex items-center gap-4 bg-background/80 p-8 rounded-2xl shadow-2xl">
            <Paperclip size={48} />
            Drop files to attach
          </div>
        </div>
      )}

      <NavigationSidebar />

      {/* Chat Sidebar */}
      <div className="hidden md:flex md:w-80 lg:w-96 bg-background/50 backdrop-blur-sm flex-col relative z-10 border-r border-black/5 dark:border-white/5">
        {/* Sidebar Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-foreground">Chats</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 w-full border-border">
            <div
              className="
                  flex items-center gap-3 
                  h-10 px-4 
                  rounded-lg
                  focus-within:outline-none
                  focus-within:ring-0
                  bg-muted/10 
                  border-none
                "
            >
              <Search className="w-4 h-4 text-muted-foreground" />

              <input
                type="text"
                placeholder="Search conversations..."
                className="
                    w-full 
                    bg-transparent 
                    focus:outline-none
                    focus:ring-0
                    focus-visible:outline-none
                    focus-visible:ring-0
                    outline-none 
                    border-none
                    text-foreground
                    placeholder:text-muted-foreground
                  "
                style={{
                  boxShadow: "none",
                  WebkitBoxShadow: "none",
                  outline: "none",
                  border: "none",
                }}
                value={filters.searchText}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: e.target.value,
                  }))
                }
              />
            </div>
          </div>




          {showFilters && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Filters
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFilters(false)}
                  className="h-6 w-6 p-0"
                >
                  <X size={12} />
                </Button>
              </div>

              {/* Date Range Filter with Calendar */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Date Range
                </label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs bg-transparent"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar size={12} className="mr-2" />
                    {filters.dateRange.from || filters.dateRange.to
                      ? `${filters.dateRange.from?.toLocaleDateString() ||
                      "Start"
                      } - ${filters.dateRange.to?.toLocaleDateString() || "End"
                      }`
                      : "Select date range"}
                  </Button>
                  {showDatePicker && (
                    <div className="p-2 bg-background border rounded-md space-y-2">
                      <Input
                        type="date"
                        placeholder="From"
                        className="text-xs"
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              from: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            },
                          }))
                        }
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        className="text-xs"
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              to: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category Filter - Text Input */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Category
                </label>
                <Input
                  placeholder="Enter category..."
                  className="text-xs"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Topic Filter - Text Input */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Topic
                </label>
                <Input
                  placeholder="Enter topic..."
                  className="text-xs"
                  value={filters.topic}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, topic: e.target.value }))
                  }
                />
              </div>

              {/* Clear Filters */}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFilters({
                    searchText: "",
                    dateRange: { from: null, to: null },
                    category: "",
                    topic: "",
                  })
                }
                className="w-full text-xs"
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted/30 rounded-lg p-1">
            {[
              { key: "recent", label: "Recent" },
              { key: "pinned", label: "Pinned" },
              { key: "project", label: "Projects" },
              { key: "shared", label: "Shared" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold hover:cursor-pointer transition-all duration-200 ${activeTab === tab.key
                  ? "active-nav-minimal text-blue-600 dark:text-foreground"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Sessions */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-5">
            {!isMounted ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Time-Based Grouping Section */}
                {isMounted && (activeTab === 'recent' || activeTab === 'pinned') && (
                  (() => {
                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const yesterdayStart = new Date(todayStart);
                    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

                    const todaySessions: LocalChatSession[] = [];
                    const yesterdaySessions: LocalChatSession[] = [];
                    const olderSessions: LocalChatSession[] = [];

                    filteredSessions.forEach(session => {
                      // Use UpdatedAt for sorting/grouping, falling back to CreatedAt
                      const date = session.updatedAt ? new Date(session.updatedAt) : new Date(session.createdAt);
                      if (date >= todayStart) {
                        todaySessions.push(session);
                      } else if (date >= yesterdayStart) {
                        yesterdaySessions.push(session);
                      } else {
                        olderSessions.push(session);
                      }
                    });

                    const renderSessionCard = (session: LocalChatSession) => (
                      <div key={session.id}>
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`group relative p-3 cursor-pointer transition-all duration-200 rounded-xl mb-2 backdrop-blur-sm ${currentSessionId === session.id
                            ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent'
                            : 'hover:bg-accent/40'
                            }`}
                          onClick={() => handleSelectSession(session.id)}
                          onMouseEnter={() => setHoveredChat(session.id)}
                          onMouseLeave={() => setHoveredChat(null)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            {editingChatId === session.id ? (
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => handleInlineRename(session.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleInlineRename(session.id);
                                  } else if (e.key === "Escape") {
                                    setEditingChatId(null);
                                    setEditingTitle("");
                                  }
                                }}
                                className="h-6 text-sm flex-1 mr-2"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <h4 className={`font-medium text-sm truncate flex-1 transition-colors ${currentSessionId === session.id ? 'text-blue-400 font-semibold' : 'text-foreground'}`}>
                                {chatTitles[session.id] || session.title}
                              </h4>
                            )}
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-6 w-6 p-0 rounded-full hover:bg-transparent transition-all duration-300 ease-out hover:scale-125 active:scale-95 ${pinnedChats.includes(session.id)
                                  ? "opacity-100 text-primary"
                                  : hoveredChat === session.id
                                    ? "opacity-100 text-muted-foreground hover:text-primary"
                                    : "opacity-0"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(session.id);
                                }}
                              >
                                {pinnedChats.includes(session.id) ? (
                                  <PinOff size={14} className="transition-colors" />
                                ) : (
                                  <Pin size={14} className="transition-colors" />
                                )}
                              </Button>
                              {hoveredChat === session.id && (
                                <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 rounded-full hover:bg-transparent text-muted-foreground hover:text-primary transition-all duration-300 ease-out hover:scale-125 active:scale-95"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChatAction({ type: "rename", chatId: session.id });
                                    }}
                                  >
                                    <Edit3 size={14} />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 rounded-full hover:bg-transparent text-muted-foreground hover:text-primary transition-all duration-300 ease-out hover:scale-125 active:scale-95"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChatAction({ type: "share", chatId: session.id });
                                    }}
                                  >
                                    <Share size={14} />
                                  </Button>



                                  <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu modal={false}>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 rounded-full hover:bg-transparent text-muted-foreground hover:text-primary transition-all duration-300 ease-out hover:scale-125 active:scale-95"
                                        >
                                          <Folder size={14} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-48 z-[200] bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl border-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5">
                                        <DropdownMenuLabel>Save to Project</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {projects.map((project) => (
                                          <DropdownMenuItem
                                            key={project.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              addChatToProject(project.id, { id: session.id, title: session.title });
                                              updateSession(session.id, { projectId: project.id });
                                              toast({ title: "Saved to Project", description: `Added chat to ${project.name}` });
                                            }}
                                          >
                                            <Folder className="mr-2 h-4 w-4" />
                                            <span>{project.name}</span>
                                          </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSaveModal(session.id);
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          <span>Create New Project</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-all duration-300 ease-out hover:scale-125 active:scale-95"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDeleteModal(session.id);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Preview Text */}
                          <p className="text-xs text-muted-foreground truncate opacity-70">
                            {session.messages?.[session.messages.length - 1]?.content.substring(0, 50) || "New conversation"}
                          </p>
                          {session.projectName && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary mt-2">
                              {session.projectName}
                            </Badge>
                          )}
                        </motion.div>
                      </div>
                    );

                    return (
                      <div className="space-y-6">
                        {/* Today Items */}
                        {todaySessions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3 px-2">
                              <h3 className="text-sm font-medium text-foreground">Today</h3>
                              <span className="text-xs text-muted-foreground">{todaySessions.length}</span>
                            </div>
                            <div className="space-y-2">
                              <AnimatePresence mode="popLayout">
                                {todaySessions.map(renderSessionCard)}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {/* Yesterday Items */}
                        {yesterdaySessions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3 px-2">
                              <h3 className="text-sm font-medium text-foreground">Yesterday</h3>
                              <span className="text-xs text-muted-foreground">{yesterdaySessions.length}</span>
                            </div>
                            <div className="space-y-2">
                              <AnimatePresence mode="popLayout">
                                {yesterdaySessions.map(renderSessionCard)}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {/* Older Items */}
                        {olderSessions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3 px-2">
                              <h3 className="text-sm font-medium text-foreground">Older</h3>
                              <span className="text-xs text-muted-foreground">{olderSessions.length}</span>
                            </div>
                            <div className="space-y-2">
                              <AnimatePresence mode="popLayout">
                                {olderSessions.map(renderSessionCard)}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Projects View */}
                {isMounted && activeTab === 'project' && (
                  <div className="space-y-6">
                    {/* Mock Projects for now - ideally comes from ProjectContext */}
                    {projects.map(project => {
                      const projectSessions = filteredSessions.filter(s => s.projectId === project.id);
                      if (projectSessions.length === 0) return null;

                      return (
                        <div key={project.id}>
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <div className="p-1 bg-primary/10 rounded">
                              <BookOpen size={12} className="text-primary" />
                            </div>
                            <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                            <span className="text-xs text-muted-foreground ml-auto">{projectSessions.length}</span>
                          </div>
                          <div className="space-y-2 pl-2 border-l border-border/50 ml-3">
                            {projectSessions.map(session => (
                              <div
                                key={session.id}
                                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-300 mb-2 border ${currentSessionId === session.id
                                    ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border-transparent'
                                    : 'hover:bg-accent/50 border-transparent'
                                    }`}
                                onClick={() => handleSelectSession(session.id)}
                              >
                                <h4 className="font-medium text-sm truncate mb-0.5">{session.title}</h4>
                                <p className="text-xs text-muted-foreground truncate">{session.preview}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {/* Uncategorized / Others */}
                    {(() => {
                      const uncategorized = filteredSessions.filter(s => !s.projectId);
                      if (uncategorized.length === 0) return null;
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Uncategorized</h3>
                            <span className="text-xs text-muted-foreground ml-auto">{uncategorized.length}</span>
                          </div>
                          <div className="space-y-2 pl-2 border-l border-border/50 ml-3">
                            {uncategorized.map(session => (
                              <div
                                key={session.id}
                                className={`group p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${currentSessionId === session.id ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent shadow-sm' : ''}`}
                                onClick={() => handleSelectSession(session.id)}
                              >
                                <h4 className="font-medium text-sm truncate mb-0.5">{session.title}</h4>
                                <p className="text-xs text-muted-foreground truncate">{session.preview}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Shared View */}
                {isMounted && activeTab === 'shared' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                      <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <Users size={16} />
                        <h3 className="font-semibold text-sm">Shared with Teammates</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Chats you've shared with collaborators or the team.
                      </p>
                    </div>

                    {/* Mock Shared List - defaulting to showing all for demo purposes or strictly shared if property exists */}
                    {filteredSessions.map(session => (
                      <div
                        key={session.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer border border-transparent hover:border-border transition-all"
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          TM
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-medium text-sm truncate">{session.title}</h4>
                            <span className="text-[10px] text-muted-foreground">{session.timestamp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1.5">{session.preview}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              Shared
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">by You</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </>
            )}
          </div>
        </ScrollArea>


      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative z-10">
        {/* Chat Header - Sleek Redesign */}
        <div className="px-6 py-4 border-b border-white/5 backdrop-blur-md sticky top-0 z-20 bg-background/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

            {/* Left: Title & Agent Info */}
            <div className="flex items-center gap-3">
               <div>
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    {currentSessionId 
                      ? (chatTitles[currentSessionId] || chatSessions.find(s => s.id === currentSessionId)?.title || "New Chat")
                      : "JARVIS Research"
                    }
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {selectedModelInfo?.model.name || "GPT-4o"}
                  </p>
               </div>
            </div>

            {/* Right: Controls (Unified Capsule) */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              
              {/* Agent & Model Capsule */}
              <div className="flex items-center bg-muted/20 hover:bg-muted/40 shadow-sm rounded-2xl p-1 pl-3 transition-all duration-300">
                 {/* Agent Selector - Compact */}
                 <div className="flex items-center gap-2 pr-3 border-r border-border/5">
                     <Select value={selectedAgent} onValueChange={(val) => {
                        if (val === 'create_new') {
                             setShowCreateAgentModal(true);
                        } else {
                             setSelectedAgent(val);
                        }
                    }}>
                      <SelectTrigger className="h-9 border-none bg-transparent p-0 text-xs font-medium focus:ring-0 focus:ring-offset-0 focus:bg-transparent data-[state=open]:bg-transparent w-auto px-2 hover:bg-white/5 rounded-lg transition-colors">
                         <div className="flex items-center justify-center text-primary">
                            <Bot size={18} />
                         </div>
                      </SelectTrigger>
                      <SelectContent className="w-[260px] rounded-2xl border-none bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 ring-1 ring-black/5 dark:ring-white/5">
                          <div className="px-3 py-2 border-b border-white/10 mb-1">
                             <h4 className="font-semibold text-sm text-blue-600 dark:text-foreground">
                                {agents.find(a => a.id === selectedAgent)?.name || customAgents.find(a => a.id === selectedAgent)?.name || "General Assistant"}
                             </h4>
                             <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Select Assistant</p>
                          </div>
                          
                          <SelectGroup>
                              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-bold mt-1">System</SelectLabel>
                              {agents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs cursor-pointer focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-white/10 dark:focus:text-white">{a.name}</SelectItem>)}
                              {customAgents.length > 0 && <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-bold mt-2">Custom</SelectLabel>}
                              {customAgents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs cursor-pointer focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-white/10 dark:focus:text-white">{a.name}</SelectItem>)}
                          </SelectGroup>
                          <SelectSeparator className="bg-white/10 my-1" />
                          <div className="p-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start text-xs h-8 px-2 hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-white/10 dark:hover:text-white"
                              onClick={() => setShowCreateAgentModal(true)}
                            >
                              <PlusCircle size={14} className="mr-2" />
                              Create New Agent
                            </Button>
                          </div>
                      </SelectContent>
                    </Select>
                 </div>

                 {/* Model Selector - Detailed Version */}
                 <div className="pl-3 pr-2">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-auto border-none bg-transparent p-0 text-xs hover:text-foreground focus:ring-0 focus:ring-offset-0 focus:bg-transparent data-[state=open]:bg-transparent w-[180px] sm:w-[220px]">
                         <div className="flex items-center gap-2 text-left">
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-tight text-blue-700 dark:text-white">
                                    {selectedModelInfo?.model.name || "GPT-4o"}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1 opacity-80">
                                  {selectedModel === "gpt-4o" && "Best for complex reasoning"}
                                  {selectedModel === "gpt-4o-mini" && "Fast, efficient for simple tasks"}
                                  {selectedModel === "o1-preview" && "Advanced reasoning"}
                                  {selectedModel === "claude-3-5-sonnet" && "Best for nuances"}
                                  {!["gpt-4o", "gpt-4o-mini", "o1-preview", "claude-3-5-sonnet"].includes(selectedModel) && "AI Model"}
                                </span>
                            </div>
                         </div>
                      </SelectTrigger>
                      <SelectContent className="w-[300px] rounded-2xl border-none bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 ring-1 ring-black/5 dark:ring-white/5">
                          {LLM_PROVIDERS.map(p => (
                             <SelectGroup key={p.id}>
                                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-bold">{p.name}</SelectLabel>
                                {p.models.map(m => (
                                   <SelectItem key={m.id} value={m.id} className="text-xs cursor-pointer py-2 focus:bg-blue-50 dark:focus:bg-white/10">
                                     <div className="flex flex-col gap-0.5">
                                        <span className={`font-medium ${selectedModel === m.id ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}>{m.name}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                           {m.id === "gpt-4o" && "Complex reasoning & analysis"}
                                           {m.id === "claude-3-5-sonnet" && "Creative & nuanced content"}
                                           {m.id === "deepseek-r1" && "Specialized for research"}
                                           {!["gpt-4o", "claude-3-5-sonnet", "deepseek-r1"].includes(m.id) && "Standard capability"}
                                        </span>
                                     </div>
                                   </SelectItem>
                                ))}
                             </SelectGroup>
                          ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-1">
                 <Button 
                    variant="ghost" 
                    className={`h-auto py-1 px-3 gap-3 rounded-xl transition-all border border-transparent hover:bg-muted/60 ${knowledgeBase 
                        ? "bg-green-500/10 hover:bg-green-500/20" 
                        : "hover:border-border/50"
                    }`}
                    onClick={() => setShowTrainModal(true)}
                 >
                    <div className={`p-1.5 rounded-lg ${knowledgeBase ? "bg-green-500/20 text-green-500" : "bg-blue-50 text-blue-700 dark:bg-primary/10 dark:text-primary"}`}>
                        <Brain size={16} />
                    </div>
                    <div className="flex flex-col items-start text-left">
                        <span className={`font-semibold text-sm leading-tight ${knowledgeBase ? "text-green-500" : "text-blue-700 dark:text-foreground"}`}>Train</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            {knowledgeBase ? "Active" : "Personalize"}
                        </span>
                    </div>
                 </Button>

                 <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-muted/40 hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
                    onClick={() => {
                      if (currentSessionId) {
                        setShowDeleteModal(currentSessionId);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
              </div>

            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-background">
          <div className="max-w-5xl mx-auto space-y-6 px-3 sm:px-4 md:px-6 pt-6 min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="mb-8 p-4 bg-primary/5 rounded-full">
                  <ModernLogo size={64} showText={false} />
                </div>
                <h2 className="text-3xl font-bold font-space-grotesk mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-white dark:to-gray-300">
                  How can I help with your research?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Ask questions, analyze papers, or get help with your writing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                  {[
                    { title: "Analyze Paper", desc: "Summarize & extract insights", icon: FileText, prompt: "Summarize this research paper and highlight key findings." },
                    { title: "Literature Review", desc: "Find patterns & citations", icon: BookOpen, prompt: "Conduct a literature review on..." },
                    { title: "Draft Abstract", desc: "Generate structured abstract", icon: Edit3, prompt: "Draft an abstract for a paper about..." },
                    { title: "Methodology", desc: "Refine research methods", icon: Map, prompt: "Suggest improvements for my methodology section." },
                  ].map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(card.prompt)}
                        className="flex items-center gap-3 p-3 bg-card/20 hover:bg-card/40 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 hover:-translate-y-0.5 group text-left ring-1 ring-transparent hover:ring-border/20"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                          <CardIcon size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h3 className="font-semibold text-xs text-foreground truncate">{card.title}</h3>
                            <p className="text-[10px] text-muted-foreground truncate opacity-80">{card.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"
                      }`}
                  >
                    <div
                      className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] p-5 shadow-sm ${message.sender === "user"
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-tr-sm shadow-md"
                        : "bg-muted/20 backdrop-blur-sm text-foreground rounded-2xl rounded-tl-sm ml-2 dark:border dark:border-white/10 dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                        }`}
                    >
                      <div className="message-bubble w-full relative group">
                        {/* Sender Label for Collaborators */}
                        {message.sender === "collaborator" && (
                             <div className="absolute -top-5 left-0 text-[10px] text-muted-foreground flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-[8px] font-bold">
                                    {message.senderName?.[0] || "C"}
                                </div>
                                {message.senderName || "Collaborator"}
                             </div>
                        )}
                        
                        {editingMessageId === message.id ? (
                            <div className="w-full mt-2">
                               <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary mb-2 text-sm"
                               />
                               <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                  <Button size="sm" onClick={() => submitEdit(message.id, editContent)}>Save & Submit</Button>
                               </div>
                            </div>
                        ) : (
                            <>
                                {message.sender === 'user' && (
                                    <button 
                                        onClick={() => startEditing(message)}
                                        className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-primary transition-all bg-muted/20 rounded-full"
                                        title="Edit Prompt"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {message.blocks?.map((block, i) => (
                                  <BlockRenderer key={i} block={block} />
                                ))}
                            </>
                        )}
                      </div>



                      {message.resources && message.resources.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <div className="text-xs font-medium text-muted-foreground mb-3">
                            <ul className="space-y-1">
                              {message.resources.map((resource, index) => (
                                <li
                                  key={index}
                                  onClick={() => window.open(resource.url, "_blank")}
                                  className="group flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {resource.title}
                                      </h4>
                                      <span className="text-[10px] text-muted-foreground opacity-50">•</span>
                                      <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                        {new URL(resource.url).hostname.replace('www.', '')}
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100 transition-all" />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <p
                        className={`text-xs mt-1 ${message.sender === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                          }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="relative flex items-center justify-center animate-pulse-scale mb-2">
                          <div className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full" />
                          <div className="relative drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                            <ModernLogo size={32} animated={true} showText={false} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-sm font-medium animate-text-wave bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent text-center">
                              <JarvisThinking />
                            </span>
                            <div className="h-6"> {/* Fixed height container for button */}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={handleStopGeneration}
                                >
                                    <StopCircle size={10} className="mr-1" /> Stop generating
                                </Button>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        {/* Input Area */}
        <div className="w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {/* Sample Prompts - Show only when no messages */}
            {messages.length === 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 justify-center">
                  {[
                    { text: "Summarize research paper", icon: FileText },
                    { text: "Explain topic simply", icon: MessageSquare },
                    { text: "Get research roadmap", icon: Map },
                    { text: "Literature survey", icon: BookOpen },
                    { text: "Research process", icon: Sparkles },
                  ].map((prompt, idx) => {
                    const PromptIcon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(prompt.text)}
                        className="px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 rounded-lg text-left transition-all hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] hover:text-primary-foreground duration-300 cursor-pointer group whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <PromptIcon
                            size={12}
                            className="text-blue-700 dark:text-muted-foreground group-hover:text-primary-foreground flex-shrink-0"
                          />
                          <span className="text-xs font-medium text-foreground group-hover:text-primary-foreground">
                            {prompt.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="p-2 bg-muted/30 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                          <Paperclip size={14} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-foreground font-medium truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive p-1 h-6 w-6"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container */}
            <div
              className={`w-full flex items-end gap-3 transition-all relative ${isDragging
                ? "ring-2 ring-primary ring-offset-2 rounded-[32px]"
                : ""
                }`}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-[32px] flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-primary font-semibold text-lg flex items-center gap-2">
                    <Paperclip size={20} />
                    Drop files here
                  </div>
                </div>
              )}

              <div className="flex-1 relative min-w-0 shadow-xl rounded-2xl bg-card/40 backdrop-blur-xl ring-0 focus-within:ring-0 focus-within:bg-card/60 transition-all duration-300">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                      }
                  }}
                  placeholder="Ask any question..."
                  className="w-full min-h-[60px] py-4 pl-5 pr-32 text-base bg-transparent border-none focus-visible:ring-0 resize-none max-h-[200px] placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,image/*,audio/*,video/*"
                    multiple
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-700 dark:text-white hover:text-foreground h-10 w-10 rounded-lg hover:bg-accent transition-all duration-300 ease-out hover:scale-125 active:scale-95"
                    disabled={isLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={20} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-blue-700 dark:text-white hover:text-foreground h-10 w-10 rounded-lg hover:bg-accent transition-all duration-300 ease-out hover:scale-125 active:scale-95 ${isRecording ? "text-destructive animate-pulse" : ""
                      }`}
                    disabled={isLoading}
                    onClick={handleVoiceInput}
                  >
                    <Mic size={20} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-blue-700 dark:text-muted-foreground hover:text-foreground h-10 w-10 rounded-lg hover:bg-accent transition-all duration-300 ease-out hover:scale-125 active:scale-95 ${showWhiteboard ? "text-primary bg-primary/10" : ""}`}
                    disabled={isLoading}
                    onClick={handleWhiteboard}
                    title="Whiteboard"
                  >
                    <Presentation size={20} />
                  </Button>

                </div>
              </div>

              <Button
                onClick={isLoading ? handleStopGeneration : handleSendMessage}
                disabled={!inputMessage.trim() && !isLoading}
                className={`h-14 md:h-14 w-14 md:w-14 rounded-xl flex-shrink-0 transition-all hover:scale-105 ${isLoading ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
              >
                {isLoading ? (
                  <StopCircle size={22} className="animate-pulse" />
                ) : (
                  <Send size={22} />
                )}
              </Button>
            </div>


          </div>
        </div>
      </div >
      {
        showShareModal && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[999]"
            style={{ pointerEvents: 'auto' }}
            onClick={() => {
              setShowShareModal(null);
              setShowCopiedNotification(false);
              setShowCollaboratorInput(false);
              setCollaboratorEmail("");
            }}
          >
            <div
              className="bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl p-6 rounded-2xl border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-md w-full mx-4 relative z-[1000] overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient Border Effect - Theme Aware */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-space-grotesk tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-white dark:to-gray-300">
                  Share Chat
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => setShowShareModal(null)}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Inline Copied Notification */}
              {showCopiedNotification && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">
                    Link copied to clipboard
                  </span>
                </div>
              )}

              {!showCollaboratorInput ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white dark:bg-black/20 hover:bg-primary/5 hover:border-primary/30 cursor-pointer h-16 border-border/50 transition-all group shadow-sm"
                    style={{ pointerEvents: 'auto' }}
                    onClick={() =>
                      handleShare(showShareModal, { type: "external" })
                    }
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:bg-primary/20 transition-colors">
                      <Link size={18} className="text-blue-700 dark:text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-foreground font-space-grotesk">Copy Link</span>
                      <span className="text-xs text-muted-foreground font-sans">Anyone with link can view</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-[10px] bg-muted text-muted-foreground">
                      External
                    </Badge>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white dark:bg-black/20 hover:bg-primary/5 hover:border-primary/30 cursor-pointer h-16 border-border/50 transition-all group shadow-sm"
                    style={{ pointerEvents: 'auto' }}
                    onClick={() =>
                      handleShare(showShareModal, { type: "collaborator" })
                    }
                  >
                    {/* Changed from Green to Primary Blue */}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:bg-primary/20 transition-colors">
                      <Users size={18} className="text-blue-700 dark:text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-foreground font-space-grotesk">Invite Collaborators</span>
                      <span className="text-xs text-muted-foreground font-sans">Share securely with team</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
                      Internal
                    </Badge>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">
                      Collaborator Email
                    </label>
                    <Input
                      placeholder="colleague@example.com"
                      className="bg-background border-input h-10 text-foreground"
                      value={collaboratorEmail}
                      onChange={(e) => setCollaboratorEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInviteCollaborator()}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Users size={12} />
                      They will receive a notification to join this chat.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleInviteCollaborator}
                      disabled={!collaboratorEmail.trim()}
                    >
                      Send Invite
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowCollaboratorInput(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Save Modal - Global Placement */}
      {
        showSaveModal && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[999]"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowSaveModal(null)}
          >
            <div
              className="bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl p-6 rounded-2xl border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-md w-full mx-4 relative z-[1000] overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground font-space-grotesk tracking-tight">
                  Save to Project
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSaveModal(null)}
                >
                  <X size={16} />
                </Button>
              </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block font-sans">
                      Select Project
                    </label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="w-full bg-background border-input">
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                      <SelectContent>
                         {projects.length > 0 ? (
                           projects.map(p => (
                             <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                           ))
                         ) : (
                           <SelectItem value="none" disabled>No projects found</SelectItem>
                         )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block font-sans">
                      Folder (Optional)
                    </label>
                    <Input placeholder="Enter folder name..." className="bg-background border-input" style={{ pointerEvents: 'auto' }} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSaveModal(null)}
                    className="hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                        if(selectedProjectId) {
                            addChatToProject(selectedProjectId, {
                                id: currentSessionId,
                                title: chatSessions.find(s => s.id === currentSessionId)?.title || "Untitled Chat"
                            });
                            toast({
                                title: "Saved to Project",
                                description: "Chat session linked successfully."
                            });
                            setShowSaveModal(null);
                        } else {
                             toast({
                                title: "Error",
                                description: "Please select a project first",
                                variant: "destructive"
                            });
                        }
                    }}
                  >
                    Save
                  </Button>
                </div>
            </div>
          </div>
        )
      }

      {/* Integrated Creativity Tools */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[999]"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            className="bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl p-6 rounded-2xl border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-sm w-full mx-4 relative z-[1000] overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                    <Trash2 size={24} className="text-destructive" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-destructive font-space-grotesk">Delete "{chatSessions.find(s => s.id === showDeleteModal)?.title || "Chat"}"?</h3>
                    <p className="text-sm text-destructive/80 mt-1 font-medium">
                        This action cannot be undone. This chat session will be permanently removed.
                    </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                    <Button 
                        variant="ghost" 
                        className="flex-1 hover:bg-muted"
                        onClick={() => setShowDeleteModal(null)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="ghost"
                        className="flex-1 bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        onClick={() => {
                            // Delete Logic
                            setChatSessions(prev => prev.filter(c => c.id !== showDeleteModal));
                            if (currentSessionId === showDeleteModal) {
                                setCurrentSessionId("");
                            }
                            setShowDeleteModal(null);
                            toast({
                                title: "Chat Deleted",
                                description: "The chat session has been permanently removed."
                            });
                        }}
                    >
                        Delete
                    </Button>
                </div>
             </div>
          </div>
        </div>
      )}
      {showWhiteboard && (
        <Whiteboard
          onClose={() => setShowWhiteboard(false)}
          onAttach={handleAttachmentFromTool}
        />
      )}

      {screenStream && (
        <ScreenShareOverlay
          stream={screenStream}
          onStop={() => {
            setScreenStream(null);
            setIsScreenSharing(false);
          }}
          onAttach={handleAttachmentFromTool}
        />
      )}
      {/* Create Agent Modal */}
      <Dialog open={showCreateAgentModal} onOpenChange={setShowCreateAgentModal}>
        <DialogContent className="bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5">
            <DialogHeader>
                <DialogTitle>{editingAgentId ? "Edit Custom Agent" : "Create Custom Agent"}</DialogTitle>
                <DialogDescription>
                    {editingAgentId ? "Update the persona and instructions for this agent." : "Define a specific persona and instructions for this agent."}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label className="text-foreground">Agent Name</Label>
                    <Input 
                        placeholder="e.g. Python Expert, Patent Lawyer" 
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-foreground">Instructions (System Prompt)</Label>
                    <Textarea 
                        placeholder="You are an expert in... You should always..." 
                        className="h-32 bg-background border-input text-foreground placeholder:text-muted-foreground resize-none"
                        value={newAgentInstructions}
                        onChange={(e) => setNewAgentInstructions(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-foreground">Enable Web Search</Label>
                        <p className="text-xs text-muted-foreground">Allow agent to search the internet for answers</p>
                    </div>
                    <Switch 
                        checked={newAgentIncludeLinks}
                        onCheckedChange={setNewAgentIncludeLinks}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => { setShowCreateAgentModal(false); setEditingAgentId(null); setNewAgentName(""); setNewAgentInstructions(""); setNewAgentIncludeLinks(true); }} className="hover:bg-muted text-muted-foreground hover:text-foreground">Cancel</Button>
                <Button onClick={handleCreateAgent} disabled={!newAgentName.trim()}>{editingAgentId ? "Save Changes" : "Create Agent"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Train Data Modal */}
      <Dialog open={showTrainModal} onOpenChange={setShowTrainModal}>
        <DialogContent className="bg-[#F8FAFC]/95 dark:bg-slate-900/90 backdrop-blur-2xl border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5">
            <DialogHeader>
                <DialogTitle>Train Knowledge Base</DialogTitle>
                <DialogDescription>
                    Upload PDFs/Documents to train the agent on specific knowledge.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-8 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/20 relative">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Drag & Drop or Click to Upload</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (Max 50MB)</p>
                </div>
                <Input 
                    type="file" 
                    multiple 
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={handleTrainUpload}
                />
            </div>
            {resoucesToTrain.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold">Selected Files:</p>
                    {resoucesToTrain.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                            <span>{f.name}</span>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => setResourcesToTrain(prev => prev.filter((_, idx) => idx !== i))}>
                                <X size={10} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowTrainModal(false)}>Cancel</Button>
                <Button onClick={startTraining} disabled={resoucesToTrain.length === 0} className="gap-2">
                    <Sparkles size={14} />
                    Start Training
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
