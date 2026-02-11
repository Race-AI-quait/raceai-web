import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, MessageSquare, Bot } from "lucide-react";
import { useChatContext } from "@/app/context/ChatContext";
import BlockRenderer from "@/components/BlockRenderer"; // Default export
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ResearchChatProps {
  sessionId?: string;
  projectId?: string;
  onNewChat?: () => void;
}

export function ResearchChat({ sessionId, projectId, onNewChat }: ResearchChatProps) {
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // 1. Prepare User Message
    const userContent = input;
    setInput(""); // Clear input early
    setIsLoading(true);

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
        currentSessionId = Date.now().toString();
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
            projectId: projectId || "",
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
               projectId // Link to project
           })
       });

       if (!response.ok) throw new Error("Failed to send message");
       
       const data = await response.json();
       
       // 4. Update with Assistant Response
       setChatSessions(prev => prev.map(s => {
           if (s.id === currentSessionId) {
               return {
                   ...s,
                   messages: [...(s.messages || []), {
                       ...data.message,
                       sender: "assistant",
                       role: "assistant"
                   }]
               };
           }
           return s;
       }));
       
       // If it was new, we might want to trigger a refresh or callback to select it officially
       if (isNewSession && onNewChat) {
           // We might need to notify parent component that a new ID is active if it manages selection state
       }

    } catch (error) {
        console.error("Chat Error:", error);
        toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        setIsLoading(false);
    } finally {
        setIsLoading(false);
    }
    
    // 5. Generate Title if new (Fire and Forget)
    if (isNewSession || messages.length === 0) {
        fetch("/api/chat/title", {
            method: "POST",
            body: JSON.stringify({ prompt: userContent, model: "gpt-4o" })
        })
        .then(res => res.json())
        .then(data => {
            if (data.title) {
                setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: data.title } : s));
            }
        })
        .catch(err => console.error("Title Generation Error:", err));
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
                        <div className={`max-w-[85%] rounded-2xl p-4 ${
                            msg.sender === 'user' 
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
                            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
