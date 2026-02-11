"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Trash2, Eraser, Pen, Type, Undo, Redo, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface WhiteboardProps {
    onClose: () => void;
    onAttach: (file: File) => void;
}

type Tool = "pen" | "eraser" | "text";

export default function Whiteboard({ onClose, onAttach }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [tool, setTool] = useState<Tool>("pen");
    const [lineWidth, setLineWidth] = useState(3);
    const [savedStates, setSavedStates] = useState<ImageData[]>([]);
    const [currentStateIndex, setCurrentStateIndex] = useState(-1);
    const [textInput, setTextInput] = useState<{ x: number, y: number, text: string } | null>(null);
    const { toast } = useToast();

    // Initialize & Resize Handler
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            // Save current content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.drawImage(canvas, 0, 0);

            // Resize
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            // Restore content
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0);

            // Re-apply settings
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.font = "20px sans-serif";
        };

        // Initial setup
        resizeCanvas();
        saveState(); // Save blank state

        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const newStates = savedStates.slice(0, currentStateIndex + 1);
        setSavedStates([...newStates, imageData]);
        setCurrentStateIndex(newStates.length);
    };

    const undo = () => {
        if (currentStateIndex <= 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const newIndex = currentStateIndex - 1;
        ctx.putImageData(savedStates[newIndex], 0, 0);
        setCurrentStateIndex(newIndex);
    };

    const redo = () => {
        if (currentStateIndex >= savedStates.length - 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const newIndex = currentStateIndex + 1;
        ctx.putImageData(savedStates[newIndex], 0, 0);
        setCurrentStateIndex(newIndex);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (tool === 'text') {
            handleTextClick(e);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool === 'text') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);

        ctx.lineWidth = tool === "eraser" ? 20 : lineWidth;
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            ctx?.closePath();
            saveState();
        }
    };

    const handleTextClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x, y } = getCoordinates(e, canvas);
        
        // If already typing, finalize previous text
        if (textInput) {
            drawTextToCanvas(textInput.text, textInput.x, textInput.y);
        }
        
        setTextInput({ x, y, text: "" });
    };

    const drawTextToCanvas = (text: string, x: number, y: number) => {
        if (!text.trim()) {
            setTextInput(null);
            return;
        }
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        ctx.fillStyle = color;
        ctx.font = `${lineWidth * 5 + 10}px sans-serif`; // Scale font with line width somewhat
        ctx.fillText(text, x, y + (lineWidth * 5 + 10)); // Adjust y to be baseline
        
        saveState();
        setTextInput(null);
    };

    const handleAttach = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `whiteboard_${Date.now()}.png`, { type: "image/png" });
                onAttach(file);
                toast({ title: "Whiteboard Attached", description: "Drawing added to project/chat." });
                onClose();
            }
        });
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `whiteboard-export-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full h-full max-w-[1400px] max-h-[900px] border border-border ring-1 ring-white/10">
                
                {/* Header / Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-border bg-white dark:bg-slate-950 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                             <h3 className="font-semibold text-lg text-black dark:text-white tracking-tight">Whiteboard</h3>
                        </div>
                   
                        
                        {/* Main Tools */}
                        <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded-xl border border-border shadow-sm">
                            <Button
                                size="sm"
                                variant={tool === "pen" ? "secondary" : "ghost"}
                                onClick={() => setTool("pen")}
                                className={`h-9 w-9 p-0 rounded-lg transition-colors ${tool === "pen" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                                title="Pen"
                            >
                                <Pen size={18} />
                            </Button>
                            <Button
                                size="sm"
                                variant={tool === "text" ? "secondary" : "ghost"}
                                onClick={() => setTool("text")}
                                className={`h-9 w-9 p-0 rounded-lg transition-colors ${tool === "text" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                                title="Text"
                            >
                                <Type size={18} />
                            </Button>
                            <Button
                                size="sm"
                                variant={tool === "eraser" ? "secondary" : "ghost"}
                                onClick={() => setTool("eraser")}
                                className={`h-9 w-9 p-0 rounded-lg transition-colors ${tool === "eraser" ? "bg-destructive text-destructive-foreground shadow-sm" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                                title="Eraser"
                            >
                                <Eraser size={18} />
                            </Button>
                            
                            <div className="w-px h-6 bg-border mx-2" />

                            <div className="flex items-center gap-1.5 px-1">
                                {["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#6366f1"].map((c) => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border-[3px] transition-all hover:scale-110 ${color === c ? "border-primary/50 shadow-md scale-110" : "border-transparent opacity-80 hover:opacity-100"}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>

                         {/* Actions */}
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={undo} disabled={currentStateIndex <= 0} title="Undo">
                                <Undo size={18} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={redo} disabled={currentStateIndex >= savedStates.length - 1} title="Redo">
                                <Redo size={18} />
                            </Button>
                             <Button size="icon" variant="ghost" className="h-9 w-9" onClick={downloadCanvas} title="Download">
                                <Download size={18} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                const canvas = canvasRef.current;
                                const ctx = canvas?.getContext("2d");
                                if (canvas && ctx) {
                                    ctx.fillStyle = "#ffffff";
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    saveState();
                                }
                            }}
                            className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200/50 hover:border-red-300 dark:border-red-900/30"
                        >
                            <Trash2 size={16} className="mr-2" />
                            Clear
                        </Button>
                        
                        <div className="h-6 w-px bg-border hidden md:block" />

                        <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={onClose}
                            className="hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={handleAttach} 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        >
                            <Check size={16} className="mr-2" /> 
                            Attach Board
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-crosshair bg-neutral-100 dark:bg-neutral-800/50">
                     {/* Text Input Overlay */}
                    {textInput && (
                        <input
                            autoFocus
                            className="absolute bg-transparent border-none outline-none p-0 m-0 z-50 font-sans"
                            style={{
                                left: textInput.x,
                                top: textInput.y,
                                color: color,
                                fontSize: `${lineWidth * 5 + 10}px`,
                                minWidth: '100px'
                            }}
                            placeholder="Type here..."
                            value={textInput.text}
                            onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    drawTextToCanvas(textInput.text, textInput.x, textInput.y);
                                }
                                if (e.key === 'Escape') {
                                    setTextInput(null);
                                }
                            }}
                            onBlur={() => drawTextToCanvas(textInput.text, textInput.x, textInput.y)}
                        />
                    )}
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full touch-none block" 
                    />
                </div>
            </div>
        </div>
    );
}
