import { Project } from "../types/project";

export const mockProjects: Project[] = [
    {
        id: "1",
        name: "Neural Network Research",
        description: "Developing novel architectures for image recognition using transformer-based models.",
        status: "active",
        progress: 65,
        dueDate: "2024-03-14",
        createdAt: "2024-01-10",
        updatedAt: "2024-02-15",
        team: [
            { id: "u1", name: "John Doe", email: "john@example.com", role: "owner", status: "online", avatar: "/avatars/john.png" },
            { id: "u2", name: "Jane Smith", email: "jane@example.com", role: "editor", status: "away", avatar: "/avatars/jane.png" }
        ],
        chatSessionIds: ["chat-123", "chat-456"],
        isStarred: true,
        color: "#3b82f6", // Blue
        rootNode: {
            id: "root-1",
            name: "Topics",
            type: "folder",
            children: [
                {
                    id: "f-1",
                    name: "Literature Review",
                    type: "folder",
                    children: [
                        { id: "d-1", name: "Transformer_Architecture.pdf", type: "file", fileType: "pdf", size: "2.4 MB", lastModified: "2 days ago", fileUrl: "/documents/Transformer_Architecture.pdf" },
                        { id: "d-2", name: "Notes_on_Attention.md", type: "file", fileType: "md", size: "15 KB", lastModified: "1 week ago", fileUrl: "/documents/Notes_on_Attention.md" }
                    ]
                },
                {
                    id: "f-2",
                    name: "Experiments",
                    type: "folder",
                    children: [
                        { id: "d-3", name: "Results_v1.csv", type: "file", fileType: "other", size: "450 KB", lastModified: "Yesterday", fileUrl: "/documents/Results_v1.csv" }
                    ]
                }
            ]
        }
    },
    {
        id: "2",
        name: "NLP Literature Review",
        description: "Comprehensive analysis of recent Large Language Models and their fine-tuning techniques.",
        status: "active",
        progress: 40,
        dueDate: "2024-03-31",
        createdAt: "2024-02-01",
        updatedAt: "2024-02-18",
        team: [
            { id: "u3", name: "Alex Brown", email: "alex@example.com", role: "owner", status: "online" }
        ],
        chatSessionIds: [],
        isStarred: false,
        color: "#10b981", // Emerald
        rootNode: {
            id: "root-2",
            name: "Topics",
            type: "folder",
            children: [
                { id: "d-4", name: "BERT_Analysis.pdf", type: "file", fileType: "pdf", size: "1.8 MB", lastModified: "3 days ago", fileUrl: "/documents/BERT_Analysis.pdf" }
            ]
        }
    },
    {
        id: "3",
        name: "Quantum Computing Algorithms",
        description: "Exploring optimization algorithms for near-term quantum devices.",
        status: "completed",
        progress: 100,
        dueDate: "2024-02-27",
        createdAt: "2023-11-15",
        updatedAt: "2024-02-27",
        team: [],
        chatSessionIds: [],
        isStarred: false,
        color: "#8b5cf6", // Purple
        rootNode: {
            id: "root-3",
            name: "Topics",
            type: "folder",
            children: []
        }
    }
];
