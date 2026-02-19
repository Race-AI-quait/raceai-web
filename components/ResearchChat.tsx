import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, MessageSquare, Bot } from "lucide-react";
import { useChatContext } from "@/app/context/ChatContext";
import BlockRenderer from "@/components/BlockRenderer"; // Default export
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

const RESEARCH_ASSISTANT_PROMPT = [
    "You are Ri, an elite research copilot that writes precise, citation-ready answers.",
    "Use the provided project context and document excerpts before relying on prior knowledge.",
    "Highlight assumptions when data is missing and keep explanations technically grounded."
].join(" ");

const MAX_CONTEXT_SNIPPET = 3200;

interface ResearchChatProps {
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
}

export function ResearchChat({
    sessionId,
    projectId,
    onNewChat,
    onSessionLinked,
    projectContext,
    fileContext
}: ResearchChatProps) {
    const { chatSessions, setChatSessions, refreshChats } = useChatContext();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Find active session or use a temporary one if none selected
    // If sessionId is provided, we find it. If not, we might be in "New Chat" mode within a project context.
    const activeSession = chatSessions.find(s => s.id === sessionId);

    // If no session is selected, we perform "New Chat" logic on first message
    const messages = activeSession?.messages || [];

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const buildSystemInstruction = () => {
        const contextParts: string[] = [];
        if (projectContext) {
            const docSummary = projectContext.documents?.length
                ? `Key docs: ${projectContext.documents.join(", ")}`
                : "";
            contextParts.push([
                `Project: ${projectContext.name}`,
                projectContext.description ? `Summary: ${projectContext.description}` : null,
                projectContext.status ? `Status: ${projectContext.status}` : null,
                projectContext.progress !== undefined ? `Progress: ${projectContext.progress}%` : null,
                docSummary || null
            ].filter(Boolean).join("\n"));
        }
        if (fileContext?.text) {
            const snippet = fileContext.text.length > MAX_CONTEXT_SNIPPET
                ? `${fileContext.text.slice(0, MAX_CONTEXT_SNIPPET)}\n...[Document truncated]`
                : fileContext.text;
            contextParts.push(`Document "${fileContext.name}" excerpt:\n${snippet}`);
        }

        if (contextParts.length === 0) return RESEARCH_ASSISTANT_PROMPT;
        return `${RESEARCH_ASSISTANT_PROMPT}\n\nContext:\n${contextParts.join("\n\n")}`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // 1. Prepare User Message
        const userContent = input;
        setInput(""); // Clear input early
        setIsLoading(true);

        const resolvedProjectId =
            projectId ?? activeSession?.projectId ?? projectContext?.id ?? undefined;
        const backendProjectId =
            typeof resolvedProjectId === "string" && resolvedProjectId.includes("-")
                ? resolvedProjectId
                : undefined;
        const systemInstruction = buildSystemInstruction();

        const userMsg: any = {
            id: Date.now().toString(),
            role: "user",
            sender: "user",
            content: userContent,
            timestamp: new Date().toISOString(),
            blocks: [{ type: "paragraph", text: userContent }] // For BlockRenderer
        };

        // 2. Optimistic Update or Create Session
        let currentSessionId = sessionId;
        let isNewSession = false;

        if (!currentSessionId) {
            // Create local temp session ID
            currentSessionId = `temp-${Date.now()}`;
            isNewSession = true;
        }

        setChatSessions(prev => {
            // If existing session
            if (prev.some(s => s.id === currentSessionId)) {
                return prev.map(s => s.id === currentSessionId ? {
                    ...s,
                    messages: [...(s.messages || []), userMsg],
                    updatedAt: new Date().toISOString()
                } : s);
            }
            // If new session (optimistic creation)
            return [{
                id: currentSessionId!,
                title: "New Research Chat",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [userMsg],
                userId: "user-1",
                projectId: resolvedProjectId,
                isPinned: false,
                isSaved: true
            } as any, ...prev];
        });

        try {
            // 3. API Call
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: isNewSession ? [userMsg] : [...messages, userMsg], // Send history
                    model: "gpt-4o",
                    projectId: backendProjectId,
                    systemInstruction,
                    sessionId: isNewSession ? undefined : currentSessionId // Send undefined if new, else ID
                })
            });

            if (!response.ok) throw new Error("Failed to send message");

            // 3.1 Check for Real Session ID
            const serverSessionId = response.headers.get("X-Session-Id");

            // If we started with a temp ID and got a real one, update it!
            if (isNewSession && serverSessionId && serverSessionId !== currentSessionId) {
                console.log("Switching from Temp ID", currentSessionId, "to Server ID", serverSessionId);

                setChatSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        return { ...s, id: serverSessionId };
                    }
                    return s;
                }));

                currentSessionId = serverSessionId; // Update local ref for the stream loop
                onSessionLinked?.(serverSessionId);

                // Trigger title generation for new chat
                fetch("/api/chat/title", {
                    method: "POST",
                    body: JSON.stringify({ prompt: userContent, model: "gpt-4o" })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.title) {
                            // Update local state
                            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: data.title } : s));

                            // Persist to backend
                            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/chat/sessions/${currentSessionId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: data.title })
                            })
                                .then(res => {
                                    if (res.ok) console.log("Title Saved:", data.title);
                                    else console.error("Title Save Failed:", res.status);
                                })
                                .catch(err => console.error("Title Persist Error:", err));
                        }
                    })
                    .catch(err => console.error("Title Generation Error:", err));
            }

            // 3.2 Handle Streaming Response
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let assistantMessage = "";

            // Create placeholder message
            const assistantMsgId = Date.now().toString();

            setChatSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return {
                        ...s,
                        messages: [...(s.messages || []), {
                            id: assistantMsgId,
                            sessionId: currentSessionId!,
                            role: "ASSISTANT",
                            senderId: "assistant",
                            sender: "assistant", // For UI compatibility if needed
                            content: "",
                            createdAt: new Date().toISOString(),
                            timestamp: new Date().toISOString(), // For UI compatibility
                            isEdited: false,
                            editedAt: ""
                        } as any]
                    };
                }
                return s;
            }));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                // Update UI with chunk
                setChatSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        const msgs = [...(s.messages || [])];
                        const lastMsgIndex = msgs.findIndex(m => m.id === assistantMsgId);
                        if (lastMsgIndex !== -1) {
                            msgs[lastMsgIndex] = {
                                ...msgs[lastMsgIndex],
                                content: assistantMessage
                            };
                        }
                        return { ...s, messages: msgs };
                    }
                    return s;
                }));
            }

        } catch (error) {
            console.error("Chat Error:", error);
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
            setIsLoading(false);
        } finally {
            setIsLoading(false);
            // Refresh full list to get consistent state (optional but safe)
            refreshChats();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{activeSession?.title || "New Chat"}</h3>
                        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
                    </div>
                </div>
                {onNewChat && (
                    <Button size="icon" variant="ghost" onClick={onNewChat} title="New Chat">
                        <Plus size={16} />
                    </Button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground mt-10">
                            <MessageSquare size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Start a conversation...</p>
                        </div>
                    )}

                    {messages.map((msg: any) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.sender === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                                }`}>
                                {msg.blocks ? (
                                    msg.blocks.map((block: any, i: number) => (
                                        <BlockRenderer key={i} block={block} />
                                    ))
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start">
                            <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm p-4">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-background/30">
                <div className="relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="pr-12 min-h-[50px] max-h-[150px] resize-none bg-muted/40 border-border/50 focus:border-primary/50"
                        rows={1}
                    />
                    <Button
                        size="icon"
                        className="absolute right-2 bottom-2 h-8 w-8"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send size={14} />
                    </Button>
                </div>
                <div className="mt-2 text-[10px] text-center text-muted-foreground">
                    AI can make mistakes. Verify important info.
                </div>
            </div>
        </div>
    );
}
