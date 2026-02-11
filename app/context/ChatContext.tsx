"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ChatSession {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    messages: ChatMessage[];
    userId: string;
    projectId: string;
    isPinned: boolean;
    isSaved: boolean;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    senderId: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    editedAt: string;
    role: "USER" | "ASSISTANT";
}

interface ChatContextState {
    chatSessions: ChatSession[];
    setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
    refreshChats: () => Promise<void>;
    updateSession: (id: string, updates: Partial<ChatSession>) => void;
    isGenerating: boolean;
    setIsGenerating: (isGenerating: boolean) => void;
}

const ChatContext = createContext<ChatContextState | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const refreshChats = async () => {
        try {
            const res = await fetch("/api/chats");
            if (res.ok) {
                const data = await res.json();
                // API returns array directly now
                const chatsArray = Array.isArray(data) ? data : (data.chats || []);
                
                setChatSessions(chatsArray.map((chat: any) => ({
                    id: chat.id,
                    title: chat.title,
                    messages: chat.messages || [],
                    createdAt: chat.created_at || chat.createdAt,
                    updatedAt: chat.updated_at || chat.updatedAt,
                    userId: chat.owner_id || "user-1",
                    projectId: chat.project_id || chat.projectId,
                    isPinned: chat.is_pinned || chat.isPinned || false,
                    isSaved: true
                })));
            }
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        }
    };

    // Initial fetch
    React.useEffect(() => {
        refreshChats();
    }, []);

    const updateSession = (id: string, updates: Partial<ChatSession>) => {
        setChatSessions(prev => prev.map(session => 
            session.id === id ? { ...session, ...updates } : session
        ));
    };

    return (
        <ChatContext.Provider value={{ chatSessions, setChatSessions, refreshChats, updateSession, isGenerating, setIsGenerating }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};
