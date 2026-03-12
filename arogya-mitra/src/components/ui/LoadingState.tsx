import React from "react";
import { motion } from "framer-motion";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center space-y-6">
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary shadow-[0_0_15px_rgba(20,184,133,0.5)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-secondary/20 border-b-secondary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-primary text-xl">A</span>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
}
