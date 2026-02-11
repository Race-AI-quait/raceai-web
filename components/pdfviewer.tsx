"use client";

import { useEffect, useRef, useState } from "react";

interface PDFViewerProps {
  fileUrl: string;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const hasInitialized = useRef(false);   // ⛔ prevents double init

  useEffect(() => {
    if (!viewerRef.current) return;
    if (hasInitialized.current) return;    // ⛔ block strict mode second mount

    hasInitialized.current = true;         // mark initialized

    import("@pdftron/webviewer").then((pdftron) => {
      pdftron.default(
        {
          path: "/lib",
          licenseKey: process.env.NEXT_PUBLIC_PDFTRON_KEY || "",
          fullAPI: true,
        },
        viewerRef.current as HTMLDivElement
      ).then((inst) => {
        instanceRef.current = inst;
        inst.UI.loadDocument(fileUrl);
      });
    });
  }, []);

  useEffect(() => {
    if (instanceRef.current && fileUrl) {
      instanceRef.current.UI.loadDocument(fileUrl);
    }
  }, [fileUrl]);

  return (
    <div
      ref={viewerRef}
      className="h-full w-full border rounded-md"
    />
  );
}
