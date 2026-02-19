"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Project, ProjectNode, ProjectStatus, ProjectCollaborator } from "../types/project";
import { mockProjects } from "../data/mockProjects";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const mapCollaborators = (collaborators: any[] = []): ProjectCollaborator[] =>
  collaborators.map((collab) => ({
    id: collab.id || collab.userId || generateId(),
    name: collab.name || collab.user?.name || "Researcher",
    email: collab.email || collab.user?.email || "",
    role: (collab.role?.toLowerCase?.() as ProjectCollaborator["role"]) || "viewer",
    avatar: collab.avatar || collab.user?.avatar || undefined,
    status: collab.status || "online",
  }));

const normalizeProjectNode = (node: any, projectId: string): ProjectNode => ({
  id: node.id || generateId(),
  name: node.name || "Untitled",
  type: node.type === "file" ? "file" : "folder",
  projectId,
  description: node.description,
  fileUrl: node.fileUrl || undefined,
  fileType: node.fileType,
  size: typeof node.size === "string" ? node.size : undefined,
  lastModified: node.lastModified,
  collaborators: node.collaborators ? mapCollaborators(node.collaborators) : undefined,
  children: Array.isArray(node.children)
    ? node.children.map((child: any) => normalizeProjectNode(child, projectId))
    : undefined,
});

const normalizeProjectFromApi = (project: any): Project => {
  const projectId = project.id || crypto.randomUUID();
  return {
    id: projectId,
    name: project.name || project.title || "Untitled Project",
    description: project.description || "",
    status: (project.status as ProjectStatus) || "active",
    progress: typeof project.progress === "number" ? project.progress : Math.floor(Math.random() * 80) + 10,
    dueDate: project.dueDate,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
    rootNode: normalizeProjectNode(project, projectId),
    team: mapCollaborators(project.collaborators),
    chatSessionIds: project.chatSessionIds || [],
    tags: project.tags || [],
    isStarred: Boolean(project.isStarred),
    color: project.color || "#3b82f6",
  };
};

interface ProjectContextState {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectStar: (id: string) => void;

  // File System Actions
  addNode: (projectId: string, parentId: string, node: ProjectNode) => void;
  updateNode: (projectId: string, nodeId: string, updates: Partial<ProjectNode>) => void;
  deleteNode: (projectId: string, nodeId: string) => void;
  addChatToProject: (projectId: string, chat: { id: string, title: string }) => void;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Load initial data
  useEffect(() => {
    const loadProjects = async () => {
      if (!BACKEND_URL) {
        setProjects(mockProjects);
        return;
      }

      let userId = "user-1";
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("race_ai_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id) userId = parsed.id;
          }
        } catch {
          // ignore parsing errors, fall back to default user
        }
      }

      try {
        const resp = await fetch(`${BACKEND_URL}/projects/structuredProjects/${userId}`);
        if (!resp.ok) {
          throw new Error(`Failed to fetch projects: ${resp.status}`);
        }
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data.map(normalizeProjectFromApi));
        } else {
          setProjects(mockProjects);
        }
      } catch (error) {
        console.error("Failed to load projects from backend, using mock data.", error);
        setProjects(mockProjects);
      }
    };

    loadProjects();
  }, []);

  const addProject = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    // Also update active if it's the one being modified
    if (activeProject && activeProject.id === id) {
      setActiveProject((prev) => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(null);
    }
  };

  const toggleProjectStar = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isStarred: !p.isStarred } : p))
    );
  };

  // Simplified Node Addition (Need complex recursion for real tree update)
  const addNode = (projectId: string, parentId: string, node: ProjectNode) => {
    // Recursive function to find parent and add node
    const addNodeRecursive = (current: ProjectNode, targetParentId: string, newNode: ProjectNode): boolean => {
      if (current.id === targetParentId) {
        if (!current.children) current.children = [];
        current.children.push(newNode);
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (addNodeRecursive(child, targetParentId, newNode)) return true;
        }
      }
      return false;
    };

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          // Deep clone rootNode to avoid mutation issues
          const newRoot = JSON.parse(JSON.stringify(project.rootNode));

          // Try adding to root first (if root is target) or traverse
          if (newRoot.id === parentId) {
            if (!newRoot.children) newRoot.children = [];
            newRoot.children.push(node);
            return { ...project, rootNode: newRoot };
          }

          if (addNodeRecursive(newRoot, parentId, node)) {
            return { ...project, rootNode: newRoot };
          }
        }
        return project;
      })
    );
  };

  const updateNode = (projectId: string, nodeId: string, updates: Partial<ProjectNode>) => {
    const updateNodeRecursive = (current: ProjectNode, targetId: string, nodeUpdates: Partial<ProjectNode>): boolean => {
      if (current.id === targetId) {
        Object.assign(current, nodeUpdates);
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (updateNodeRecursive(child, targetId, nodeUpdates)) return true;
        }
      }
      return false;
    };

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const newRoot = JSON.parse(JSON.stringify(project.rootNode));
          if (updateNodeRecursive(newRoot, nodeId, updates)) {
            return { ...project, rootNode: newRoot };
          }
        }
        return project;
      })
    );
  };

  const deleteNode = (projectId: string, nodeId: string) => {
    const deleteNodeRecursive = (current: ProjectNode, targetId: string): boolean => {
      if (current.children) {
        const index = current.children.findIndex(c => c.id === targetId);
        if (index !== -1) {
          current.children.splice(index, 1);
          return true;
        }
        return current.children.some(child => deleteNodeRecursive(child, targetId));
      }
      return false;
    };

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          if (project.rootNode.id === nodeId) {
            return project;
          }
          const newRoot = JSON.parse(JSON.stringify(project.rootNode));
          if (deleteNodeRecursive(newRoot, nodeId)) {
            return { ...project, rootNode: newRoot };
          }
        }
        return project;
      })
    );
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      setActiveProject,
      setActiveProject,
      setProjects,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectStar,
      addNode,
      updateNode,
      deleteNode,
      addChatToProject: (projectId: string, chat: { id: string, title: string }) => {
          setProjects(prev => prev.map(p => {
              if (p.id === projectId) {
                  // Check if already exists to prevent dupes
                  const exists = p.rootNode.associatedChats?.some(c => c.id === chat.id);
                  if (exists) return p;

                  const newRoot = JSON.parse(JSON.stringify(p.rootNode));
                  if (!newRoot.associatedChats) newRoot.associatedChats = [];
                  
                  newRoot.associatedChats.push({
                      id: chat.id,
                      title: chat.title,
                      lastMessage: "Linked from Jarvis", // Mock
                      timestamp: new Date(),
                      messageCount: 0
                  });
                  return { ...p, rootNode: newRoot };
              }
              return p;
          }));
      }
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectProvider");
  return ctx;
};
