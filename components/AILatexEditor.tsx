"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { useMonaco, OnMount } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Download, Square, Check, RefreshCw, Type, AlignLeft, Bot, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import dynamic from "next/dynamic";
import { ProjectNode } from '@/app/types/project';
import { AILatexAssistant } from './AILatexAssistant'; // We will build this next

const PDFViewer = dynamic(() => import("@/components/pdfviewer"), { ssr: false });

interface AILatexEditorProps {
    file: ProjectNode;
    initialContent?: string;
    onSave?: (content: string) => void;
    onContentSave?: (content: string) => void; // Persist to backend
}

export const AILatexEditor: React.FC<AILatexEditorProps> = ({ file, initialContent, onSave, onContentSave }) => {
    const { toast } = useToast();
    const monaco = useMonaco();
    const [latexCode, setLatexCode] = useState<string>(
        initialContent ||
        "\\documentclass{article}\n\\begin{document}\nHello World from " + file.name + "\n\\end{document}"
    );

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isCompiling, setIsCompiling] = useState(false);
    const [compilationError, setCompilationError] = useState<string | null>(null);
    const [showAssistant, setShowAssistant] = useState(false);

    // Debounced auto-save
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestContentRef = useRef(latexCode);

    useEffect(() => {
        latestContentRef.current = latexCode;
    }, [latexCode]);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                if (onContentSave) onContentSave(latestContentRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const debouncedSave = useCallback((content: string) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            if (onContentSave) onContentSave(content);
        }, 2000); // 2 second debounce
    }, [onContentSave]);
    const [editorWidthPercent, setEditorWidthPercent] = useState(50);
    const splitContainerRef = useRef<HTMLDivElement>(null);
    const isResizingSplitRef = useRef(false);

    // Drag handler for editor/PDF split
    const handleSplitResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingSplitRef.current = true;

        const onMouseMove = (ev: MouseEvent) => {
            if (!isResizingSplitRef.current || !splitContainerRef.current) return;
            const rect = splitContainerRef.current.getBoundingClientRect();
            const percent = ((ev.clientX - rect.left) / rect.width) * 100;
            setEditorWidthPercent(Math.max(20, Math.min(80, percent)));
        };

        const onMouseUp = () => {
            isResizingSplitRef.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    // Clean up object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    const handleCompile = async () => {
        setIsCompiling(true);
        setCompilationError(null);
        try {
            const response = await fetch('/api/latex/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latexCode })
            });

            const data = await response.json();

            if (data.success && data.pdfBase64) {
                // Create a blob URL from the base64 string
                const byteCharacters = atob(data.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                setPdfUrl(url);

                toast({ title: "Compilation Successful", description: "PDF updated." });
            } else {
                setCompilationError(data.log || data.error || 'Compilation failed.');
                toast({ title: "Compilation Failed", description: "Check logs for details.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Compile error", error);
            toast({ title: "Compilation Error", description: "Failed to reach server.", variant: "destructive" });
        } finally {
            setIsCompiling(false);
        }
    };

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Add custom commands or syntax highlights if needed.
        // Monaco has basic LaTeX support.
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleCompile();
        });
    };

    const handleDownload = () => {
        const blob = new Blob([latexCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Compile on initial mount if content exists
    useEffect(() => {
        if (initialContent) {
            handleCompile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssistant(!showAssistant)}
                        className={`border-primary/20 hover:border-primary/50 bg-primary/5 text-primary ${showAssistant ? 'bg-primary/20' : ''}`}
                    >
                        <Bot size={16} className="mr-2" />
                        AI Assistant
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        title="Download Source"
                    >
                        <Download size={16} />
                    </Button>

                    <Button
                        variant={isCompiling ? "destructive" : "default"}
                        size="sm"
                        onClick={isCompiling ? () => { } : handleCompile}
                        disabled={isCompiling}
                    >
                        {isCompiling ? (
                            <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Compiling...
                            </>
                        ) : (
                            <>
                                <Play size={16} className="mr-2" />
                                Compile
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden" ref={splitContainerRef}>
                {/* Monaco Editor Pane */}
                <div
                    className={`flex flex-col border-r border-border/20 ${showAssistant ? 'max-w-[400px]' : ''}`}
                    style={{ width: showAssistant ? undefined : `${editorWidthPercent}%`, flexShrink: 0 }}
                >
                    <Editor
                        height="100%"
                        defaultLanguage="latex"
                        theme="vs-dark"
                        value={latexCode}
                        onChange={(val: string | undefined) => {
                            const newVal = val || "";
                            setLatexCode(newVal);
                            if (onSave) onSave(newVal);
                            debouncedSave(newVal);
                        }}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            fontSize: 14,
                            fontFamily: "'Cascadia Code', 'Fira Code', 'Courier New', monospace",
                            lineNumbers: 'on',
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* AI Assistant Pane */}
                {showAssistant && (
                    <div className="w-80 border-r border-border/20 bg-card flex flex-col animate-in slide-in-from-left-4 duration-200">
                        <AILatexAssistant
                            code={latexCode}
                            onUpdateCode={(newCode: string) => {
                                setLatexCode(newCode)
                                if (onSave) onSave(newCode)
                            }}
                            errorLog={compilationError}
                        />
                    </div>
                )}

                {/* Draggable Resize Handle */}
                {!showAssistant && (
                    <div
                        className="flex items-center justify-center w-1 cursor-col-resize hover:bg-primary/30 transition-colors group flex-shrink-0 relative z-10"
                        onMouseDown={handleSplitResizeStart}
                    >
                        <div className="w-0.5 h-8 rounded-full bg-border/40 group-hover:bg-primary transition-colors" />
                    </div>
                )}

                {/* PDF Preview Pane */}
                <div className="flex-1 flex flex-col bg-muted/20 relative min-w-0">
                    {isCompiling && !pdfUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                            <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-xl shadow-xl border border-border">
                                <RefreshCw size={32} className="animate-spin text-primary" />
                                <span className="font-semibold text-sm">Compiling Document...</span>
                            </div>
                        </div>
                    )}

                    {pdfUrl ? (
                        <PDFViewer fileUrl={pdfUrl} />
                    ) : compilationError ? (
                        <div className="p-6 h-full overflow-auto">
                            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 font-mono text-xs whitespace-pre-wrap">
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <ExternalLink size={16} /> Compilation Error
                                </h3>
                                {compilationError}
                            </div>
                            {showAssistant && (
                                <Button
                                    variant="default"
                                    className="mt-4 w-full"
                                    onClick={() => {
                                        // This would trigger the "Debug" command in the Assistant
                                        document.dispatchEvent(new CustomEvent('ai-latex-debug'));
                                    }}
                                >
                                    <Bot size={16} className="mr-2" />
                                    Debug with AI
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4">
                            <Type size={48} className="opacity-20" />
                            <p>Click Compile to render PDF preview</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
