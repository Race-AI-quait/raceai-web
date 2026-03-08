"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Sparkles, Wrench, Bug, MessageSquare, Send, X, Copy, Check, CopyCheck } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';

interface AILatexAssistantProps {
    code: string;
    onUpdateCode: (newCode: string) => void;
    errorLog?: string | null;
}

export const AILatexAssistant: React.FC<AILatexAssistantProps> = ({ code, onUpdateCode, errorLog }) => {
    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, setInput } = useChat({
        api: '/api/chat', // use the general existing chat endpoint assuming it exists, or customize it if needed.
        // We may need to attach system context in the initial messages.
        initialMessages: [
            {
                id: 'system-latex',
                role: 'system',
                content: 'You are an expert LaTeX assistant. Your goal is to help the user write, debug, and improve LaTeX documents. Always provide the LaTeX code in markdown code blocks named `latex`. Explain your reasoning briefly.'
            }
        ],
    });

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Listen for the custom "Debug with AI" event triggered from the parent
    useEffect(() => {
        const handleDebug = () => {
            if (errorLog) {
                handleAction('debug');
            }
        };
        document.addEventListener('ai-latex-debug', handleDebug);
        return () => document.removeEventListener('ai-latex-debug', handleDebug);
    }, [errorLog]);

    const extractLatexCode = (text: string): string | null => {
        // Try to extract from a markdown code block first
        const regex = /```latex\n([\s\S]*?)```/i;
        const match = text.match(regex);
        if (match && match[1]) {
            return match[1].trim();
        }
        // Fallback: if it starts with \documentclass or something, but usually code block is fine
        return null;
    };

    const handleApplyCode = (text: string) => {
        const newCode = extractLatexCode(text);
        if (newCode) {
            onUpdateCode(newCode);
            toast({ title: "Code Applied", description: "The LaTeX code was updated in the editor." });
        } else {
            toast({ title: "No Code Found", description: "Could not find a valid LaTeX code block to apply.", variant: "destructive" });
        }
    };

    const handleAction = (actionType: 'write' | 'debug' | 'fix' | 'improve') => {
        let prompt = "";

        switch (actionType) {
            case 'write':
                // Normally would ask user, but here we prepopulate the input
                setInput("Please write LaTeX code for: ");
                return; // Early return to let user type
            case 'debug':
                if (!errorLog) {
                    toast({ title: "No Errors", description: "There is no compilation error to debug." });
                    return;
                }
                prompt = `I have a LaTeX compilation error. Please explain what is wrong.\n\nMy Code:\n\`\`\`latex\n${code}\n\`\`\`\n\nError Log:\n\`\`\`\n${errorLog}\n\`\`\``;
                break;
            case 'fix':
                if (!errorLog) {
                    toast({ title: "No Errors", description: "There is no compilation error to fix." });
                    return;
                }
                prompt = `Please fix my LaTeX code based on this compilation error. Provide the full corrected code.\n\nMy Code:\n\`\`\`latex\n${code}\n\`\`\`\n\nError Log:\n\`\`\`\n${errorLog}\n\`\`\``;
                break;
            case 'improve':
                prompt = `Please review my LaTeX code, improve its formatting, use of packages, and structure. Provide the improved code.\n\nMy Code:\n\`\`\`latex\n${code}\n\`\`\``;
                break;
        }

        // Submit the custom prompt by faking an event
        const event = { preventDefault: () => { } } as any;
        handleSubmit(event, { data: { promptOverride: prompt } });
        // Since NextJS AI SDK handleSubmit doesn't easily let us pass a direct string without changing input state first,
        // we manually append to chat using a custom submit, or manipulate the input.
        // For simplicity with useChat:
        setInput(prompt);
        setTimeout(() => {
            const form = document.getElementById('ai-latex-form') as HTMLFormElement;
            if (form) form.requestSubmit();
        }, 50);
    };

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                <Bot className="text-primary" size={18} />
                <h3 className="font-semibold text-sm">AI Assistant</h3>
            </div>

            {/* Action Buttons */}
            <div className="p-2 grid grid-cols-2 gap-2 border-b border-border/50">
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start" onClick={() => handleAction('write')}>
                    <Sparkles size={14} className="mr-2 text-yellow-500" /> Write
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start" onClick={() => handleAction('improve')}>
                    <MessageSquare size={14} className="mr-2 text-blue-500" /> Improve
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start border-destructive/20 hover:bg-destructive/10" disabled={!errorLog} onClick={() => handleAction('debug')}>
                    <Bug size={14} className="mr-2 text-destructive" /> Debug Error
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start border-green-500/20 hover:bg-green-500/10" disabled={!errorLog} onClick={() => handleAction('fix')}>
                    <Wrench size={14} className="mr-2 text-green-500" /> Auto Fix
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pb-4">
                    {messages.filter(m => m.role !== 'system').length === 0 && (
                        <div className="text-center text-muted-foreground text-xs mt-10 space-y-2">
                            <Bot size={32} className="mx-auto opacity-20" />
                            <p>Ask me to generate tables, write formulas, or fix errors.</p>
                        </div>
                    )}

                    {messages.filter(m => m.role !== 'system').map(m => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}`}>
                                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                            </div>
                            <div className={`flex flex-col gap-1 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50'}`}>
                                    {m.role === 'user' ? (
                                        m.content
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-xs">
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        const isLatex = match && match[1] === 'latex';
                                                        const codeStr = String(children).replace(/\n$/, '');
                                                        return !inline ? (
                                                            <div className="relative group mt-2 mb-2 rounded-md bg-zinc-950 p-2 border border-zinc-800 flex flex-col items-end">
                                                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                                    {isLatex && (
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shadow-md"
                                                                            onClick={() => handleApplyCode("```latex\n" + codeStr + "\n```")}
                                                                            title="Apply to Editor"
                                                                        >
                                                                            <Check size={12} className="text-green-400" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className="w-full text-left">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <code className="bg-zinc-800/50 px-1 py-0.5 rounded text-[10px]" {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                                <Bot size={12} className="animate-pulse" />
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 w-16 flex items-center justify-center">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/50">
                <form id="ai-latex-form" onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask for help or changes..."
                        className="text-xs h-9 bg-muted/50 focus-visible:ring-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim()}>
                        <Send size={14} />
                    </Button>
                </form>
            </div>

        </div>
    );
};
