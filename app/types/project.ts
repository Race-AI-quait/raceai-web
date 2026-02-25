export type ProjectStatus = "active" | "completed" | "archived";
export type ProjectRole = "owner" | "editor" | "viewer";

export interface ProjectCollaborator {
  id: string;
  name: string;
  email: string;
  role: ProjectRole;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
}

// Tree Node for Files/Folders
export interface ProjectNode {
  id: string;
  name: string;
  type: "folder" | "file";
  projectId?: string;
  parentId?: string; // Helpful for traversal
  description?: string;
  content?: string; // For simple notes/text files
  fileUrl?: string; // For actual documents (PDFs etc)
  fileType?: "pdf" | "md" | "txt" | "image" | "other";
  size?: string;
  lastModified?: string;
  collaborators?: ProjectCollaborator[]; // Specific assignees for a file?
  children?: ProjectNode[];

  // Extended properties for Research Page
  associatedChats?: {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
  }[];
  notes?: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: string;
  }[];
}

// Top-Level Project Container
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  // Content
  rootNode: ProjectNode; // The root folder of the project
  team: ProjectCollaborator[];
  chatSessionIds: string[]; // Linked chats

  // Metadata
  tags?: string[];
  isStarred?: boolean;
  color?: string; // UI visual identifier
}
