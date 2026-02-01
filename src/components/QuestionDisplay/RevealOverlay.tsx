"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TWEENS } from "@/lib/motion";

interface RevealOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function RevealOverlay({ isOpen, onClose, children }: RevealOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-canvas/95 flex items-center justify-center z-50 p-4 overflow-hidden cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TWEENS.gentle}
          onClick={onClose}
        >
          <motion.div
            className="max-w-lg w-full max-h-[80vh] overflow-hidden cursor-default"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={TWEENS.gentle}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
