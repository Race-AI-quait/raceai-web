import { db as mockDb } from '@/db/client';
import { db as oldDb } from '@/lib/db';
import { ChatSession, Project } from '@/db/schema';
import { DbChat } from '@/lib/db';

const USE_MOCK_DB = process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true';

// Normalize ChatSession Type
// The old DB uses DbChat, new uses ChatSession. We need to normalize to ChatSession for the API.
function normalizeChat(chat: DbChat | ChatSession): ChatSession {
    if ('messages' in chat) {
        // It's a DbChat (old)
        return {
            id: chat.id,
            title: chat.title,
            project_id: chat.projectId,
            owner_id: 'user-1', // Default
            created_at: chat.createdAt,
            updated_at: chat.updatedAt,
            model: 'gpt-4o', // Default
            is_pinned: chat.isPinned || false,
        };
    }
    return chat as ChatSession;
}

export const dataService = {
  // --- Chats ---
  async getChats(projectId?: string) {
    if (USE_MOCK_DB) {
       return mockDb.getChats(projectId);
    } else {
       // Old DB doesn't support project filtering efficiently, but we can try
       const chats = await oldDb.getChats();
       const normalized = chats.map(normalizeChat);
       if (projectId) {
           return normalized.filter(c => c.project_id === projectId);
       }
       return normalized;
    }
  },

  async createChat(chatConfig: any) {
    if (USE_MOCK_DB) {
      return mockDb.createChat(chatConfig);
    } else {
      // Create using old DB
        const newChat: DbChat = {
            id: Date.now().toString(),
            title: chatConfig.title || "New Chat",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            projectId: chatConfig.project_id,
            isPinned: chatConfig.is_pinned
        };
        const created = await oldDb.createChat(newChat);
        return normalizeChat(created);
    }
  },

  // --- Projects ---
  // Old DB didn't support projects, so these only work in Mock Mode or future Supabase mode
  async getProjects() {
    if (USE_MOCK_DB) {
      return mockDb.getProjects();
    }
    return []; // Return empty if not using mock/supabase
  },

  async createProject(projectConfig: any) {
    if (USE_MOCK_DB) {
      return mockDb.createProject(projectConfig);
    }
    throw new Error("Projects not supported in legacy mode");
  }
};
