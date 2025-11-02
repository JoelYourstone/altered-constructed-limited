"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { AnimatePresence, motion } from "motion/react";

type ProcessingStatus =
  | "processing"
  | "success"
  | "failure"
  | "already-scanned";

interface ProcessingItem {
  status: ProcessingStatus;
}

export interface ProcessingScanAreaRef {
  onTinyUrlScan: (tinyUrl: string) => void;
  onSuccess: (tinyUrl: string) => void;
  onFailure: (tinyUrl: string, reason?: string) => void;
}

const ProcessingScanArea = forwardRef<ProcessingScanAreaRef>((props, ref) => {
  const [processingCards, setProcessingCards] = useState<
    Map<string, ProcessingItem>
  >(new Map());

  const handleTinyUrlScan = (tinyUrl: string) => {
    setProcessingCards((prev) => {
      const next = new Map(prev);
      next.set(tinyUrl, { status: "processing" });
      return next;
    });
  };

  const transitionToFinalState = (
    tinyUrl: string,
    finalStatus: "success" | "failure" | "already-scanned"
  ) => {
    // Immediately transition to final state
    setProcessingCards((prev) => {
      const next = new Map(prev);
      const currentItem = next.get(tinyUrl);
      if (currentItem && currentItem.status === "processing") {
        next.set(tinyUrl, { ...currentItem, status: finalStatus });
      }
      return next;
    });

    // Show result for 2000ms then remove
    setTimeout(() => {
      setProcessingCards((prev) => {
        const next = new Map(prev);
        next.delete(tinyUrl);
        return next;
      });
    }, 2000);
  };

  const handleSuccess = (tinyUrl: string) => {
    transitionToFinalState(tinyUrl, "success");
  };

  const handleFailure = (tinyUrl: string, reason?: string) => {
    if (reason === "Card already scanned") {
      transitionToFinalState(tinyUrl, "already-scanned");
      return;
    }
    transitionToFinalState(tinyUrl, "failure");
  };

  useImperativeHandle(ref, () => ({
    onTinyUrlScan: handleTinyUrlScan,
    onSuccess: handleSuccess,
    onFailure: handleFailure,
  }));

  return (
    <>
      {processingCards.size > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-sm text-foreground/70 mb-3">
            Processing
          </h2>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {Array.from(processingCards.entries()).map(([tinyUrl, item]) => (
                <motion.div
                  key={tinyUrl}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-lg border border-black/[.08] dark:border-white/[.145] bg-foreground/5 flex items-center justify-center"
                >
                  {item.status === "processing" && (
                    <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  )}
                  {item.status === "success" && (
                    <span className="text-2xl">✅</span>
                  )}
                  {item.status === "failure" && (
                    <span className="text-2xl">❌</span>
                  )}
                  {item.status === "already-scanned" && (
                    <span className="text-2xl">🔄</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
});

ProcessingScanArea.displayName = "ProcessingScanArea";

export default ProcessingScanArea;
