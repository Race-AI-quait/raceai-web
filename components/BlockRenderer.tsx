"use client";

import { Block } from "@/app/types/blocks";

import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { nord } from "react-syntax-highlighter/dist/cjs/styles/prism";

// KaTeX
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

import { useState } from "react";
import { X, Play, FileText, Download, Music, Video } from "lucide-react";

import Markdown from "./Markdown";

export default function BlockRenderer({ block }: { block: Block }) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  switch (block.type) {
    case "paragraph":
    case "text":
      return (
        <div className="leading-relaxed text-sm">
          <Markdown>{block.text}</Markdown>
        </div>
      );

    case "heading":
      const levels: any = {
        1: "text-2xl font-bold",
        2: "text-xl font-semibold",
        3: "text-lg font-semibold",
        4: "text-base font-medium",
      };
      return (
        <h1 className={`${levels[block.level]} mt-3 mb-2`}>
          {block.text}
        </h1>
      );

    case "list":
      return block.ordered ? (
        <ol className="list-decimal ml-6 space-y-1 text-sm">
          {block.items.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc ml-6 space-y-1 text-sm">
          {block.items.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "latex":
      return block.display ? (
        <BlockMath math={block.latex} />
      ) : (
        <InlineMath math={block.latex} />
      );

    case "code":
      return (
        <div className="relative my-4">
          <button
            onClick={() => navigator.clipboard.writeText(block.code)}
            className="absolute top-2 right-2 bg-muted/40 px-2 py-1 text-xs rounded-md hover:bg-muted transition-colors"
          >
            Copy
          </button>

          <SyntaxHighlighter
            language={block.language || "text"}
            style={nord}
            customStyle={{
              borderRadius: "12px",
              padding: "16px",
              fontSize: "13px",
            }}
          >
            {block.code}
          </SyntaxHighlighter>
        </div>
      );

    case "image":
      return (
        <>
          <div
            className="relative group cursor-zoom-in my-2 inline-block"
            onClick={() => setIsImageOpen(true)}
          >
            <img
              src={block.url || block.image}
              alt={block.alt}
              className="rounded-xl max-h-48 object-cover border border-white/10 shadow-sm transition-transform hover:scale-[1.02]"
            />
          </div>

          {isImageOpen && (
            <div
              className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setIsImageOpen(false)}
            >
              <button
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                onClick={() => setIsImageOpen(false)}
              >
                <X size={24} />
              </button>
              <img
              src={block.url || block.image}
              alt={block.alt}
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl scale-100"
              onClick={(e) => e.stopPropagation()}
            />
            </div>
          )}
        </>
      );

    case "video":
      return (
        <div className="my-2 max-w-sm">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
            <Video size={12} />
            <span>Video Attachment</span>
          </div>
          <video
            controls
            src={block.url}
            className="w-full rounded-xl border border-white/10 bg-black"
          />
        </div>
      );

    case "audio":
      return (
        <div className="my-2 p-3 bg-muted/30 border border-white/10 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Music size={20} />
          </div>
          <div className="flex-1">
            <audio controls src={block.url} className="w-full h-8" />
          </div>
        </div>
      );

    case "file":
      return (
        <a
          href={block.url}
          download
          target="_blank"
          className="flex items-center gap-3 p-3 my-2 bg-muted/20 border border-white/10 rounded-xl hover:bg-muted/40 transition-all group max-w-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:text-blue-400">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{block.name}</div>
            {block.size && <div className="text-xs text-muted-foreground">{block.size}</div>}
          </div>
          <Download size={16} className="text-muted-foreground group-hover:text-foreground" />
        </a>
      );

    case "link":
      return (
        <a
          href={block.url}
          target="_blank"
          className="text-primary underline text-sm hover:text-primary/80 transition-colors"
        >
          {block.text}
        </a>
      );

    default:
      return null;
  }
}
