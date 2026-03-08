"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  RotateCw,
  Loader2,
  FileText,
  Highlighter,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface PDFViewerProps {
  fileUrl: string;
  onTextExtracted?: (text: string) => void;
}

export default function PDFViewer({ fileUrl, onTextExtracted }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [highlights, setHighlights] = useState<
    { page: number; text: string; color: string }[]
  >([]);
  const [highlightMode, setHighlightMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setPageNumber(1);
      setPageInputValue("1");
    },
    []
  );

  // Extract text for AI Q&A when document loads
  useEffect(() => {
    if (!fileUrl || !onTextExtracted) return;

    let isMounted = true;
    let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null;

    const extractText = async () => {
      try {
        loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        if (!isMounted) return;
        const textParts: string[] = [];
        const maxPages = Math.min(pdf.numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
          if (!isMounted) return;
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(" ");
          textParts.push(pageText);
        }
        if (isMounted) {
          onTextExtracted(textParts.join("\n\n---\n\n"));
        }
      } catch (err: any) {
        if (isMounted && err?.name !== 'PasswordException') {
          console.error("Failed to extract PDF text:", err);
        }
      }
    };

    extractText();

    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy().catch(() => { });
      }
    };
  }, [fileUrl, onTextExtracted]);

  // Page navigation
  const goToPage = (page: number) => {
    const target = Math.max(1, Math.min(page, numPages));
    setPageNumber(target);
    setPageInputValue(String(target));
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed)) goToPage(parsed);
  };

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const zoomFit = () => setScale(1.0);

  // Rotation
  const rotate = () => setRotation((r) => (r + 90) % 360);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Download
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = "document.pdf";
    a.click();
  };

  // Text selection for highlights
  const handleTextSelection = useCallback(() => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setHighlights((prev) => [
        ...prev,
        { page: pageNumber, text, color: "#fde047" },
      ]);
      selection.removeAllRanges();
    }
  }, [highlightMode, pageNumber]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowLeft":
          goToPage(pageNumber - 1);
          break;
        case "ArrowRight":
          goToPage(pageNumber + 1);
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pageNumber, numPages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
    >
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shadow-sm z-10">
        {/* Left: Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(1)}
            disabled={pageNumber <= 1}
            title="First page"
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>

          <form
            onSubmit={handlePageInputSubmit}
            className="flex items-center gap-1"
          >
            <Input
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              className="w-10 h-7 text-center text-xs px-1 bg-zinc-50 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600"
              onBlur={handlePageInputSubmit}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              / {numPages}
            </span>
          </form>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            title="Next page"
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(numPages)}
            disabled={pageNumber >= numPages}
            title="Last page"
          >
            <ChevronsRight size={14} />
          </Button>
        </div>

        {/* Center: Zoom & view controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </Button>
          <button
            onClick={zoomFit}
            className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors min-w-[44px] text-center"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </Button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={rotate}
            title="Rotate"
          >
            <RotateCw size={14} />
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant={highlightMode ? "default" : "ghost"}
            size="icon"
            className={`h-7 w-7 ${highlightMode
              ? "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-400/30"
              : ""
              }`}
            onClick={() => setHighlightMode(!highlightMode)}
            title={
              highlightMode ? "Disable highlight mode" : "Enable highlight mode"
            }
          >
            <Highlighter size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            title="Download"
          >
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        </div>
      </div>

      {/* ─── Highlights bar ─── */}
      {highlights.length > 0 && (
        <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/30 flex items-center gap-2 overflow-x-auto">
          <Highlighter size={12} className="text-yellow-600 shrink-0" />
          <span className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 shrink-0">
            {highlights.length} highlight{highlights.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1 overflow-x-auto">
            {highlights.slice(-5).map((h, i) => (
              <span
                key={i}
                className="text-[10px] bg-yellow-200/60 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded truncate max-w-[150px] cursor-pointer hover:bg-yellow-300/60"
                onClick={() => goToPage(h.page)}
                title={`Page ${h.page}: ${h.text}`}
              >
                p.{h.page}: {h.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Document Area ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto flex justify-center py-4"
        onMouseUp={handleTextSelection}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading document...
            </p>
          </div>
        )}

        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
            setIsLoading(false);
          }}
          loading={null}
          error={
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
              <FileText
                size={48}
                className="text-zinc-300 dark:text-zinc-600"
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                Failed to load PDF document.
                <br />
                The file may be corrupted or inaccessible.
              </p>
            </div>
          }
          className={isLoading ? "hidden" : ""}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg rounded-sm border border-zinc-200 dark:border-zinc-700"
            loading={
              <div className="flex items-center justify-center h-96 w-full">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            }
          />
        </Document>
      </div>

      {/* ─── Bottom status bar ─── */}
      <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <span>{Math.round(scale * 100)}% zoom</span>
        {highlightMode && (
          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
            ● Highlight mode
          </span>
        )}
      </div>
    </div>
  );
}
