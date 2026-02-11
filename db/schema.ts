export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'deleted';
  settings?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  project_id?: string; // Optional linkage to project
  owner_id: string;
  created_at: string;
  updated_at: string;
  model: string;
  system_prompt?: string; // For custom agents
  is_pinned: boolean;
  folder_id?: string; // If we organize by folders
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // JSON string or text
  created_at: string;
  metadata?: {
    resources?: Array<{ title: string; url: string }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
}

export interface Collaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
  invited_by: string;
}

export interface SharedChat {
  id: string;
  chat_id: string;
  user_id: string; // The person it is shared WITH
  permission: 'view' | 'edit';
  created_at: string;
}

// Database Structure for JSON file
export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  chats: ChatSession[];
  messages: Message[];
  collaborators: Collaborator[];
  shared_chats: SharedChat[];
}
