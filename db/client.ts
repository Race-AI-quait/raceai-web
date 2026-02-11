import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Project, ChatSession, User, Message } from './schema';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'db', 'data.json');

// Initial seed data
const initialData: DatabaseSchema = {
  users: [
    {
      id: "user-1",
      email: "demo@raceai.com",
      full_name: "Demo User",
      created_at: new Date().toISOString()
    },
    {
      id: "user-2",
      email: "collab@raceai.com",
      full_name: "Dr. Collaborator",
      created_at: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Quantum Resistance Research",
      description: "Analyzing late-stage quantum supremacy papers.",
      owner_id: "user-1",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  chats: [
    {
      id: "chat-1",
      title: "Literature Review: Qubit Stability",
      project_id: "proj-1",
      owner_id: "user-1",
      model: "gpt-4o",
      is_pinned: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  messages: [
    {
        id: "msg-1",
        chat_id: "chat-1",
        role: "user",
        content: "Summarize the latest findings on qubit stability.",
        created_at: new Date().toISOString()
    },
    {
        id: "msg-2",
        chat_id: "chat-1",
        role: "assistant",
        content: "Recent studies indicate a 40% improvement using error-correcting codes...",
        created_at: new Date().toISOString()
    }
  ],
  collaborators: [
      {
          id: "collab-1",
          project_id: "proj-1",
          user_id: "user-2",
          role: "viewer",
          created_at: new Date().toISOString(),
          invited_by: "user-1"
      }
  ],
  shared_chats: []
};

class LocalDB {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DB_PATH)) {
      this.saveData(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse DB, resetting", e);
      return initialData;
    }
  }

  private saveData(data: DatabaseSchema) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return this.data.projects;
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.projects.push(newProject);
    this.saveData(this.data);
    return newProject;
  }

  // --- Chats ---
  async getChats(projectId?: string): Promise<ChatSession[]> {
    if (projectId) {
      return this.data.chats.filter(c => c.project_id === projectId);
    }
    return this.data.chats;
  }

  async createChat(chat: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>): Promise<ChatSession> {
    const newChat: ChatSession = {
      ...chat,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.chats.push(newChat);
    this.saveData(this.data);
    return newChat;
  }

  async getChat(id: string): Promise<ChatSession | undefined> {
    return this.data.chats.find(c => c.id === id);
  }

  // --- Messages ---
  async getMessages(chatId: string): Promise<Message[]> {
    return this.data.messages.filter(m => m.chat_id === chatId);
  }

  async addMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    this.data.messages.push(newMessage);
    this.saveData(this.data);
    return newMessage;
  }
}

export const db = new LocalDB();
