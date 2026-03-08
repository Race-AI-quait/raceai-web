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
  content: node.content || undefined,
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
  saveFileContent: (projectId: string, nodeId: string, content: string) => void;
  addChatToProject: (projectId: string, chat: { id: string, title: string }) => void;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Seed mock projects to the backend when user has no projects
  const seedMockProjects = async (userId: string) => {
    if (!BACKEND_URL) return;

    const seedNode = async (node: ProjectNode, projectId: string, parentFolderId: string | null) => {
      if (node.type === "folder") {
        const resp = await fetch(`${BACKEND_URL}/project-folders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, parentFolderId, name: node.name }),
        });
        if (!resp.ok) return;
        const created = await resp.json();
        // Recurse into children
        if (node.children) {
          for (const child of node.children) {
            await seedNode(child, projectId, created.id);
          }
        }
      } else {
        await fetch(`${BACKEND_URL}/project-files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId: parentFolderId,
            name: node.name,
            fileUrl: node.fileUrl || "",
            fileType: node.fileType || "other",
          }),
        });
      }
    };

    for (const mock of mockProjects) {
      // Create the project
      const resp = await fetch(`${BACKEND_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: userId,
          title: mock.name,
          description: mock.description,
          tags: mock.tags || [],
        }),
      });
      if (!resp.ok) continue;
      const createdProject = await resp.json();

      // Seed the root node's children (folders and files)
      if (mock.rootNode.children) {
        for (const child of mock.rootNode.children) {
          await seedNode(child, createdProject.id, null);
        }
      }
    }
  };

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
          // No projects in DB → seed mock data, then re-fetch
          console.log("No projects found, seeding mock projects...");
          await seedMockProjects(userId);
          const resp2 = await fetch(`${BACKEND_URL}/projects/structuredProjects/${userId}`);
          const data2 = await resp2.json();
          if (Array.isArray(data2) && data2.length > 0) {
            setProjects(data2.map(normalizeProjectFromApi));
          } else {
            // Seeding failed or no data returned, use mock as fallback
            setProjects(mockProjects);
          }
        }
      } catch (error) {
        console.warn("Failed to load projects from backend, using mock data.", error);
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

  // Helper: find a node's type in the tree
  const findNodeType = (root: ProjectNode, nodeId: string): "file" | "folder" | null => {
    if (root.id === nodeId) return root.type;
    if (root.children) {
      for (const child of root.children) {
        const result = findNodeType(child, nodeId);
        if (result) return result;
      }
    }
    return null;
  };

  // Persist node addition to backend
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

    // Update local state optimistically
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const newRoot = JSON.parse(JSON.stringify(project.rootNode));
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

    // Persist to backend (fire-and-forget with error logging)
    if (BACKEND_URL) {
      (async () => {
        try {
          if (node.type === "folder") {
            const resp = await fetch(`${BACKEND_URL}/project-folders`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                parentFolderId: parentId === projectId ? null : parentId,
                name: node.name,
              }),
            });
            if (resp.ok) {
              const created = await resp.json();
              // Update local node with backend-assigned id
              setProjects((prev) =>
                prev.map((p) => {
                  if (p.id === projectId) {
                    const root = JSON.parse(JSON.stringify(p.rootNode));
                    const updateIdRecursive = (current: ProjectNode) => {
                      if (current.id === node.id) {
                        current.id = created.id;
                        return true;
                      }
                      return current.children?.some(updateIdRecursive) ?? false;
                    };
                    updateIdRecursive(root);
                    return { ...p, rootNode: root };
                  }
                  return p;
                })
              );
            } else {
              console.error("Failed to persist folder:", await resp.text());
            }
          } else {
            // File creation: parentId is the folderId
            const resp = await fetch(`${BACKEND_URL}/project-files`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folderId: parentId === projectId ? null : parentId,
                name: node.name,
                fileUrl: node.fileUrl || "",
                fileType: node.fileType || "other",
                content: node.content || null,
              }),
            });
            if (resp.ok) {
              const created = await resp.json();
              setProjects((prev) =>
                prev.map((p) => {
                  if (p.id === projectId) {
                    const root = JSON.parse(JSON.stringify(p.rootNode));
                    const updateIdRecursive = (current: ProjectNode) => {
                      if (current.id === node.id) {
                        current.id = created.id;
                        return true;
                      }
                      return current.children?.some(updateIdRecursive) ?? false;
                    };
                    updateIdRecursive(root);
                    return { ...p, rootNode: root };
                  }
                  return p;
                })
              );
            } else {
              console.error("Failed to persist file:", await resp.text());
            }
          }
        } catch (err) {
          console.error("Backend persist error (addNode):", err);
        }
      })();
    }
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

    // Determine if this is a file or folder before state update
    let nodeType: "file" | "folder" | null = null;
    for (const p of projects) {
      if (p.id === projectId) {
        nodeType = findNodeType(p.rootNode, nodeId);
        break;
      }
    }

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

    // Persist rename/update to backend
    if (BACKEND_URL && nodeType) {
      const endpoint = nodeType === "folder" ? "project-folders" : "project-files";
      fetch(`${BACKEND_URL}/${endpoint}/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: updates.name }),
      }).catch((err) => console.error("Backend persist error (updateNode):", err));
    }
  };

  const deleteNode = (projectId: string, nodeId: string) => {
    // Determine node type before deleting
    let nodeType: "file" | "folder" | null = null;
    for (const p of projects) {
      if (p.id === projectId) {
        nodeType = findNodeType(p.rootNode, nodeId);
        break;
      }
    }

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

    // Persist deletion to backend
    if (BACKEND_URL && nodeType) {
      const endpoint = nodeType === "folder" ? "project-folders" : "project-files";
      fetch(`${BACKEND_URL}/${endpoint}/${nodeId}`, {
        method: "DELETE",
      }).catch((err) => console.error("Backend persist error (deleteNode):", err));
    }
  };

  // Save file content to backend and update local state
  const saveFileContent = (projectId: string, nodeId: string, content: string) => {
    // Update local state immediately
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const newRoot = JSON.parse(JSON.stringify(project.rootNode));
          const updateContentRecursive = (current: ProjectNode): boolean => {
            if (current.id === nodeId) {
              current.content = content;
              return true;
            }
            return current.children?.some(updateContentRecursive) ?? false;
          };
          updateContentRecursive(newRoot);
          return { ...project, rootNode: newRoot };
        }
        return project;
      })
    );

    // Persist to backend
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/project-files/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).catch((err) => console.error("Backend persist error (saveFileContent):", err));
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      setActiveProject,
      setProjects,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectStar,
      addNode,
      updateNode,
      deleteNode,
      saveFileContent,
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
