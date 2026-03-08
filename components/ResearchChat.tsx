"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Send,
    Plus,
    MessageSquare,
    Bot,
    Mic,
    StopCircle,
    Paperclip,
    X,
    FileText,
    ImageIcon,
    Sparkles,
    FolderOpen,
    Eye,
} from "lucide-react";
import { useChatContext } from "@/app/context/ChatContext";
import BlockRenderer from "@/components/BlockRenderer";
import Markdown from "@/components/Markdown";
import { useToast } from "@/components/ui/use-toast";

// ─── PDF.js Setup ────────────────────────────────────────────
let pdfjsLib: any = null;
if (typeof window !== "undefined") {
    pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
}

// ─── Constants ───────────────────────────────────────────────
const RESEARCH_SYSTEM_PROMPT = [
    "You are Ri, an elite research copilot embedded as part of the RACE AI research workspace.",
    "Responsibilities:",
    "1. Treat every query as a technical or research task and respond with structured, rigorous analysis.",
    "2. Format responses using Markdown: use headings, bullet points, tables, and code blocks for clarity.",
    "3. For multi-step reasoning, break into numbered steps with clear conclusions.",
    "4. Cite sources when available and highlight assumptions when data is missing.",
    "5. Mathematical expressions must use $inline$ or $$block$$ LaTeX delimiters.",
    "6. Use the provided project context and document excerpts BEFORE relying on prior knowledge.",
    "7. When answering about specific files or documents, reference them by name.",
    "8. Keep explanations technically grounded, citation-ready, and professional.",
    "9. Maintain a professional yet approachable tone suitable for advanced researchers.",
].join(" ");

const MAX_CONTEXT_CHARS = 6000;
const MAX_FILE_SNIPPET = 2000;

// ─── Types ───────────────────────────────────────────────────
interface ProjectFileInfo {
    name: string;
    content?: string;
    type?: string;
    path?: string;
}

export interface ResearchChatProps {
    sessionId?: string;
    projectId?: string;
    onNewChat?: () => void;
    onSessionLinked?: (sessionId: string) => void;
    projectContext?: {
        id: string;
        name: string;
        description?: string;
        status?: string;
        progress?: number;
        documents?: string[];
    };
    fileContext?: {
        name: string;
        text: string;
        type?: string;
    } | null;
    /** All files across the active project for RAG context */
    allProjectFiles?: ProjectFileInfo[];
}

// ─── Component ───────────────────────────────────────────────
export function ResearchChat({
    sessionId,
    projectId,
    onNewChat,
    onSessionLinked,
    projectContext,
    fileContext,
    allProjectFiles,
}: ResearchChatProps) {
    const { chatSessions, setChatSessions, refreshChats } = useChatContext();
    const { toast } = useToast();

    // ── Chat State ──
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // ── Voice Input State ──
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // ── File Attachment State ──
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Session ──
    const activeSession = chatSessions.find((s) => s.id === sessionId);
    const messages = activeSession?.messages || [];

    // ── Auto-scroll ──
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    // ─── PDF Text Extraction ─────────────────────────────────
    const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
        try {
            if (!pdfjsLib) {
                pdfjsLib = (window as any).pdfjsLib;
                if (pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
                }
            }
            if (!pdfjsLib) return `[PDF: ${file.name} — extraction unavailable]`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";
            for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
            }
            return fullText.trim() || `[PDF: ${file.name} — no extractable text]`;
        } catch {
            return `[PDF: ${file.name} — extraction failed]`;
        }
    }, []);

    // ─── Build RAG System Instruction ────────────────────────
    const buildSystemInstruction = useCallback(() => {
        const contextParts: string[] = [];

        // 1. PRIMARY CONTEXT — currently open file
        if (fileContext?.text) {
            const snippet =
                fileContext.text.length > MAX_CONTEXT_CHARS
                    ? `${fileContext.text.slice(0, MAX_CONTEXT_CHARS)}\n...[Document truncated — ${fileContext.text.length} chars total]`
                    : fileContext.text;
            contextParts.push(
                `[PRIMARY DOCUMENT — Currently Open]\nFile: "${fileContext.name}" (${fileContext.type || "text"})\n\n${snippet}`
            );
        }

        // 2. PROJECT CONTEXT — metadata
        if (projectContext) {
            const parts = [
                `Project: ${projectContext.name}`,
                projectContext.description ? `Description: ${projectContext.description}` : null,
                projectContext.status ? `Status: ${projectContext.status}` : null,
                projectContext.progress !== undefined ? `Progress: ${projectContext.progress}%` : null,
            ].filter(Boolean);
            contextParts.push(`[ACTIVE PROJECT]\n${parts.join("\n")}`);
        }

        // 3. PROJECT FILES — summaries of all files in the project
        if (allProjectFiles && allProjectFiles.length > 0) {
            let totalChars = 0;
            const fileSummaries: string[] = [];
            for (const f of allProjectFiles) {
                // Skip the primary file (already in primary context)
                if (fileContext && f.name === fileContext.name) continue;

                if (f.content) {
                    const snippet =
                        f.content.length > MAX_FILE_SNIPPET
                            ? f.content.slice(0, MAX_FILE_SNIPPET) + "...[truncated]"
                            : f.content;
                    const entry = `• ${f.name} (${f.type || "file"}):\n${snippet}`;
                    totalChars += entry.length;
                    if (totalChars > MAX_CONTEXT_CHARS * 2) {
                        fileSummaries.push(`• ${f.name} (${f.type || "file"}): [content omitted — context limit]`);
                    } else {
                        fileSummaries.push(entry);
                    }
                } else {
                    fileSummaries.push(`• ${f.name} (${f.type || "file"})`);
                }
            }
            if (fileSummaries.length > 0) {
                contextParts.push(
                    `[PROJECT FILES — ${fileSummaries.length} files in workspace]\n${fileSummaries.join("\n\n")}`
                );
            }
        } else if (projectContext?.documents && projectContext.documents.length > 0) {
            // Fallback to just document names
            contextParts.push(
                `[PROJECT FILES]\n${projectContext.documents.map((d) => `• ${d}`).join("\n")}`
            );
        }

        if (contextParts.length === 0) return RESEARCH_SYSTEM_PROMPT;
        return `${RESEARCH_SYSTEM_PROMPT}\n\n─── CONTEXT ───\n${contextParts.join("\n\n")}`;
    }, [fileContext, projectContext, allProjectFiles]);

    // ─── Audio Visualizer ────────────────────────────────────
    const drawVisualizer = useCallback(() => {
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
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                canvasCtx.fillStyle = `rgba(99, 102, 241, ${barHeight / 150})`;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    }, []);

    // ─── Voice Input ─────────────────────────────────────────
    const handleVoiceInput = useCallback(async () => {
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
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    setIsTranscribing(true);
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    try {
                        setInput((prev) => prev + (prev ? " " : "") + "Transcribing audio...");
                        const formData = new FormData();
                        formData.append("file", audioBlob, "audio.webm");

                        const res = await fetch("/api/speech-to-text", {
                            method: "POST",
                            body: formData,
                        });

                        setInput((prev) => prev.replace("Transcribing audio...", ""));

                        if (res.ok) {
                            const data = await res.json();
                            setInput((prev) => prev + (prev ? " " : "") + data.text);
                        } else {
                            toast({ title: "Error", description: "Failed to transcribe audio.", variant: "destructive" });
                        }
                    } catch {
                        setInput((prev) => prev.replace("Transcribing audio...", ""));
                        toast({ title: "Error", description: "Failed to transcribe audio.", variant: "destructive" });
                    } finally {
                        setIsTranscribing(false);
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch {
                toast({
                    title: "Microphone Access Denied",
                    description: "Please allow microphone permissions.",
                    variant: "destructive",
                });
                setIsRecording(false);
            }
        } else {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close();
            }
            setIsRecording(false);
        }
    }, [isRecording, drawVisualizer, toast]);

    // ─── File Upload ─────────────────────────────────────────
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
        }
    }, []);

    const removeFile = useCallback((index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // ─── Stop Generation ────────────────────────────────────
    const handleStopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    }, []);

    // ─── Send Message ────────────────────────────────────────
    const handleSend = async () => {
        if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

        // Process attached files
        const processedFiles = await Promise.all(
            uploadedFiles.map(async (file) => {
                if (file.type === "application/pdf") {
                    const textContent = await extractTextFromPDF(file);
                    return { type: "text" as const, content: textContent, mime: file.type, name: file.name };
                }

                return new Promise<{ type: "image" | "text"; content: string; mime: string; name: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        if (file.type.startsWith("image/")) {
                            resolve({ type: "image", content: result, mime: file.type, name: file.name });
                        } else {
                            resolve({ type: "text", content: result, mime: file.type, name: file.name });
                        }
                    };
                    if (file.type.startsWith("image/")) {
                        reader.readAsDataURL(file);
                    } else if (file.type.startsWith("text/") || file.name.match(/\.(md|json|js|ts|tsx|csv|txt|tex)$/)) {
                        reader.readAsText(file);
                    } else {
                        resolve({ type: "text", content: `[Attached File: ${file.name}]`, mime: file.type, name: file.name });
                    }
                });
            })
        );

        const userContent = input;
        setInput("");
        setUploadedFiles([]);
        setIsLoading(true);

        const resolvedProjectId =
            projectId ?? activeSession?.projectId ?? projectContext?.id ?? undefined;
        const backendProjectId =
            typeof resolvedProjectId === "string" && resolvedProjectId.includes("-")
                ? resolvedProjectId
                : undefined;
        const systemInstruction = buildSystemInstruction();

        // Build user message with blocks
        const userMsg: any = {
            id: Date.now().toString(),
            role: "user",
            sender: "user",
            content: userContent,
            timestamp: new Date().toISOString(),
            blocks: [
                { type: "paragraph", text: userContent },
                ...processedFiles.map((f) => {
                    if (f.type === "image") {
                        return { type: "image", url: f.content, alt: f.name };
                    }
                    return { type: "file", name: f.name, url: f.content, size: "File" };
                }),
            ],
        };

        // Optimistic Update or Create Session
        let currentSessionId = sessionId;
        let isNewSession = false;

        if (!currentSessionId) {
            currentSessionId = `temp-${Date.now()}`;
            isNewSession = true;
        }

        setChatSessions((prev) => {
            if (prev.some((s) => s.id === currentSessionId)) {
                return prev.map((s) =>
                    s.id === currentSessionId
                        ? { ...s, messages: [...(s.messages || []), userMsg], updatedAt: new Date().toISOString() }
                        : s
                );
            }
            return [
                {
                    id: currentSessionId!,
                    title: "New Research Chat",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: [userMsg],
                    userId: "user-1",
                    projectId: resolvedProjectId,
                    isPinned: false,
                    isSaved: true,
                } as any,
                ...prev,
            ];
        });

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            // Build API content (multimodal)
            const apiContent: any[] = [];
            if (userContent) apiContent.push({ type: "text", text: userContent });
            processedFiles.forEach((f) => {
                if (f.type === "image") {
                    apiContent.push({ type: "image", image: f.content });
                } else {
                    apiContent.push({ type: "text", text: `\n--- ${f.name} ---\n${f.content}\n--- End File ---\n` });
                }
            });

            const response = await fetch("/api/chat", {
                signal: controller.signal,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: isNewSession
                        ? [{ role: "user", sender: "user", content: apiContent.length > 1 ? apiContent : userContent }]
                        : [
                            ...messages.slice(-20).map((msg: any) => ({
                                role: msg.sender === "user" ? "user" : "assistant",
                                sender: msg.sender,
                                content: msg.content || "",
                            })),
                            { role: "user", sender: "user", content: apiContent.length > 1 ? apiContent : userContent },
                        ],
                    model: "gpt-4o",
                    projectId: backendProjectId,
                    systemInstruction,
                    sessionId: isNewSession ? undefined : currentSessionId,
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            // Sync session ID from server
            const serverSessionId = response.headers.get("X-Session-Id");
            if (isNewSession && serverSessionId && serverSessionId !== currentSessionId) {
                setChatSessions((prev) =>
                    prev.map((s) => (s.id === currentSessionId ? { ...s, id: serverSessionId } : s))
                );
                currentSessionId = serverSessionId;
                onSessionLinked?.(serverSessionId);

                // Generate title
                fetch("/api/chat/title", {
                    method: "POST",
                    body: JSON.stringify({ prompt: userContent, model: "gpt-4o" }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.title) {
                            setChatSessions((prev) =>
                                prev.map((s) => (s.id === currentSessionId ? { ...s, title: data.title } : s))
                            );
                            fetch(
                                `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5005"}/chat/sessions/${currentSessionId}`,
                                {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ title: data.title }),
                                }
                            ).catch(console.error);
                        }
                    })
                    .catch(console.error);
            }

            // Streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let assistantMessage = "";
            const assistantMsgId = (Date.now() + 1).toString();

            // Parse resources from header
            const resourcesHeader = response.headers.get("X-RaceAI-Resources");
            let parsedResources: any[] = [];
            if (resourcesHeader) {
                try {
                    parsedResources = JSON.parse(atob(resourcesHeader));
                } catch { }
            }

            // Create placeholder assistant message
            setChatSessions((prev) =>
                prev.map((s) => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: [
                                ...(s.messages || []),
                                {
                                    id: assistantMsgId,
                                    sessionId: currentSessionId!,
                                    role: "ASSISTANT",
                                    senderId: "assistant",
                                    sender: "assistant",
                                    content: "",
                                    createdAt: new Date().toISOString(),
                                    timestamp: new Date().toISOString(),
                                    isEdited: false,
                                    editedAt: "",
                                    blocks: [{ type: "paragraph", text: "" }],
                                } as any,
                            ],
                        };
                    }
                    return s;
                })
            );

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                setChatSessions((prev) =>
                    prev.map((s) => {
                        if (s.id === currentSessionId) {
                            const msgs = [...(s.messages || [])];
                            const idx = msgs.findIndex((m) => m.id === assistantMsgId);
                            if (idx !== -1) {
                                msgs[idx] = {
                                    ...msgs[idx],
                                    content: assistantMessage,
                                    blocks: [{ type: "paragraph", text: assistantMessage }],
                                    resources: parsedResources.length > 0 ? parsedResources : undefined,
                                };
                            }
                            return { ...s, messages: msgs };
                        }
                        return s;
                    })
                );
            }
        } catch (error: any) {
            if (error.name === "AbortError") {
                console.log("Generation aborted");
                return;
            }
            console.error("Chat Error:", error);
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            refreshChats();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── Render ──────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* ── Header ── */}
            <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <Bot size={14} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                            {activeSession?.title || "Research Assistant"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {messages.length} messages
                            {fileContext ? ` · Viewing: ${fileContext.name}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {onNewChat && (
                        <Button size="icon" variant="ghost" onClick={onNewChat} title="New Chat" className="h-7 w-7">
                            <Plus size={14} />
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Active Context Indicator ── */}
            {(fileContext || projectContext) && (
                <div className="px-3 py-1.5 border-b border-border/20 bg-primary/[0.03]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {fileContext && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5 gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shrink-0"
                            >
                                <Eye size={10} />
                                {fileContext.name}
                            </Badge>
                        )}
                        {projectContext && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5 gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shrink-0"
                            >
                                <FolderOpen size={10} />
                                {projectContext.name}
                            </Badge>
                        )}
                        {allProjectFiles && allProjectFiles.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                                · {allProjectFiles.length} files in context
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Messages ── */}
            <ScrollArea className="flex-1 px-3 py-3">
                <div className="space-y-5">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-muted-foreground mt-8 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-3">
                                <Sparkles size={22} className="text-indigo-500" />
                            </div>
                            <p className="text-sm font-medium mb-1">Research Assistant</p>
                            <p className="text-xs text-center text-muted-foreground/70 mb-4">
                                {fileContext
                                    ? `Ask me anything about "${fileContext.name}" or your project.`
                                    : "Ask questions, analyze papers, or get research help."}
                            </p>
                            <div className="grid grid-cols-1 gap-1.5 w-full max-w-[280px]">
                                {[
                                    { text: "Summarize this document", icon: FileText },
                                    { text: "Key findings & insights", icon: Sparkles },
                                    { text: "Explain methodology", icon: MessageSquare },
                                ].map((prompt, idx) => {
                                    const PromptIcon = prompt.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setInput(prompt.text)}
                                            className="flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-left transition-all text-xs group"
                                        >
                                            <PromptIcon size={12} className="text-muted-foreground group-hover:text-primary shrink-0" />
                                            <span className="text-muted-foreground group-hover:text-foreground">{prompt.text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {messages.map((msg: any) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                            <div
                                className={`max-w-[90%] p-3.5 ${msg.sender === "user"
                                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-tr-sm shadow-sm"
                                    : "bg-muted/20 backdrop-blur-sm text-foreground rounded-2xl rounded-tl-sm border border-border/30"
                                    }`}
                            >
                                {msg.sender === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:text-xs">
                                        {msg.content ? (
                                            <Markdown>{msg.content}</Markdown>
                                        ) : msg.blocks ? (
                                            msg.blocks.map((block: any, i: number) => <BlockRenderer key={i} block={block} />)
                                        ) : null}
                                    </div>
                                ) : msg.blocks ? (
                                    msg.blocks.map((block: any, i: number) => <BlockRenderer key={i} block={block} />)
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}

                                {/* Resources */}
                                {msg.resources && msg.resources.length > 0 && (
                                    <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
                                        {msg.resources.map((resource: any, index: number) => (
                                            <div
                                                key={index}
                                                onClick={() => window.open(resource.url, "_blank")}
                                                className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-xs"
                                            >
                                                <span className="truncate text-muted-foreground hover:text-primary">{resource.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    ))}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-start">
                            <div className="bg-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl rounded-tl-sm p-3.5">
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500 relative" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                                <button
                                    onClick={handleStopGeneration}
                                    className="mt-2 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                                >
                                    <StopCircle size={10} /> Stop generating
                                </button>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* ── Input Area ── */}
            <div className="p-3 border-t border-border/30 bg-background/50">
                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-2 space-y-1">
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="px-2 py-1.5 bg-muted/30 rounded-lg flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-2 min-w-0">
                                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        {file.type.startsWith("image/") ? (
                                            <ImageIcon size={12} />
                                        ) : (
                                            <Paperclip size={12} />
                                        )}
                                    </div>
                                    <span className="text-xs text-foreground truncate max-w-[160px]">{file.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="text-muted-foreground hover:text-destructive p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Container */}
                <div className="w-full bg-white dark:bg-[#1E1F20] rounded-2xl border border-border/40 shadow-sm flex flex-col relative overflow-hidden transition-all focus-within:ring-1 focus-within:ring-primary/30">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isTranscribing
                                ? "Transcribing..."
                                : fileContext
                                    ? `Ask about ${fileContext.name}...`
                                    : "Ask anything..."
                        }
                        className="w-full bg-transparent text-foreground placeholder-muted-foreground border-none resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 p-3 pb-10 min-h-[70px] max-h-[140px] overflow-y-auto text-sm shadow-none"
                        disabled={isLoading}
                    />

                    {/* Audio Visualizer Canvas */}
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-8 absolute bottom-10 left-0 pointer-events-none transition-opacity duration-300 ${isRecording ? "opacity-100" : "opacity-0"
                            }`}
                    />

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                            {/* File Attach */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,.tex,image/*"
                                multiple
                            />
                            <button
                                className="p-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                disabled={isLoading}
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach file"
                            >
                                <Paperclip size={16} />
                            </button>

                            {/* Voice Input */}
                            <button
                                className={`p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ${isRecording ? "text-destructive" : "text-muted-foreground"
                                    }`}
                                disabled={isLoading}
                                onClick={handleVoiceInput}
                                title={isRecording ? "Stop recording" : "Voice input"}
                            >
                                {isRecording ? <StopCircle size={16} className="animate-pulse" /> : <Mic size={16} />}
                            </button>
                        </div>

                        {/* Send / Stop */}
                        <button
                            onClick={isLoading ? handleStopGeneration : handleSend}
                            disabled={!input.trim() && uploadedFiles.length === 0 && !isLoading}
                            className="p-1.5 h-8 w-8 shrink-0 rounded-full bg-foreground text-background disabled:opacity-30 disabled:bg-muted-foreground/30 disabled:text-muted-foreground transition-all hover:bg-foreground/90 flex items-center justify-center"
                            title={isLoading ? "Stop" : "Send"}
                        >
                            {isLoading ? <StopCircle size={14} className="animate-pulse" /> : <Send size={14} className="-ml-px" />}
                        </button>
                    </div>
                </div>

                <div className="mt-1.5 text-[10px] text-center text-muted-foreground/60">
                    AI can make mistakes. Verify important info.
                </div>
            </div>
        </div>
    );
}
