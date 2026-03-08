import { ChatSession } from '@/db/schema';
import { api } from './api';

const USE_MOCK_DB = process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// We need to match the backend's expected format
// Backend ChatSession: { id, title, userId, projectId, isPinned, isSaved, createdAt, updatedAt, messages: [] }

export const dataService = {
  // --- Chats ---
  async getChats(projectId?: string) {
    if (USE_MOCK_DB) {
      // Mock implementation omitted for brevity as we are focusing on backend
      return [];
    } else {
      try {
        // We'll fetch all chats for the user (hardcoded user-1 for now as per existing pattern)
        // Or if we have a way to get the current user ID, we should use it. 
        // For now, let's assume 'user-1' or fetch from a generic endpoint if available.
        // The backend has `getUserChatSessions` at `/chat/sessions/user/:userId`
        // And `getChats` at `/chat/user/:userId` (alias)

        const userId = 'user-1';
        const res = await fetch(`${BACKEND_URL}/chat/user/${userId}`);

        if (!res.ok) throw new Error('Failed to fetch chats');

        const chats = await res.json();

        // Normalize messages for frontend
        const normalizedChats = chats.map((chat: any) => ({
          ...chat,
          messages: (chat.messages || []).map((msg: any) => ({
            ...msg,
            role: msg.role?.toLowerCase(),
            sender: msg.role === 'USER' ? 'user' : 'assistant'
          }))
        }));

        if (projectId) {
          return normalizedChats.filter((c: any) => c.projectId === projectId);
        }
        return normalizedChats;
      } catch (err) {
        console.error("Error fetching chats from backend:", err);
        return [];
      }
    }
  },

  async createChat(chatConfig: any) {
    if (USE_MOCK_DB) {
      return { id: Date.now().toString(), ...chatConfig };
    } else {
      const payload = {
        title: chatConfig.title || "New Chat",
        userId: chatConfig.owner_id || "user-1",
        projectId: chatConfig.project_id || chatConfig.projectId,
        isPinned: chatConfig.is_pinned || false,
        isSaved: true
      };

      const res = await fetch(`${BACKEND_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create chat: ${errorText || res.status}`);
      }
      return await res.json();
    }
  },

  async addMessage(sessionId: string, message: any) {
    if (USE_MOCK_DB) return message;

    const payload = {
      sessionId,
      senderId: message.role === 'user' ? (message.senderId || 'user-1') : null, // Assistant usually has null senderId or handled by backend
      role: message.role.toUpperCase(), // Backend enum is USER/ASSISTANT
      content: message.content
    };

    const res = await fetch(`${BACKEND_URL}/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to save message: ${errorText || res.status}`);
    }
    return await res.json();
  },

  async updateChat(sessionId: string, updates: any) {
    if (USE_MOCK_DB) return;

    // Map updates to backend expected format
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.isPinned !== undefined) payload.isPinned = updates.isPinned;
    if (updates.isSaved !== undefined) payload.isSaved = updates.isSaved;

    const res = await fetch(`${BACKEND_URL}/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update chat: ${errorText || res.status}`);
    }
    return await res.json();
  },

  async deleteChat(sessionId: string) {
    if (USE_MOCK_DB) return;

    const res = await fetch(`${BACKEND_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete chat: ${errorText || res.status}`);
    }
    return await res.json();
  },

  // --- Projects ---
  async getProjects() {
    return []; // Not implemented for now
  },

  async createProject(projectConfig: any) {
    throw new Error("Projects not supported yet");
  },

  // --- Knowledge History ---
  async saveKnowledgeQuery(userId: string, data: any) {
    if (USE_MOCK_DB) return data;

    const payload = {
      userId,
      query: data.query,
      stateOfTheArt: data.stateOfTheArt,
      recentGroundbreaking: data.recentGroundbreaking,
      topics: data.topics,
      topResearchers: data.topResearchers,
      news: data.news,
      funding: data.funding,
      roadmap: data.roadmap,
      edgeProblems: data.edgeProblems,
    };

    try {
      return await api.post('/knowledge', payload);
    } catch (error: any) {
      console.error(`Failed to save knowledge history:`, error);
      return null;
    }
  },

  async getKnowledgeHistory(userId: string) {
    if (USE_MOCK_DB) return [];

    try {
      // Use api.get instead of raw fetch
      return await api.get(`/knowledge/user/${userId}`);
    } catch (err) {
      // Supress the console error output to avoid Next.js overlay popup if it's just a network absence
      console.warn("Could not fetch knowledge history, continuing with empty history.");
      return [];
    }
  }
};
