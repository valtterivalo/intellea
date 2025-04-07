'use client';

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";

interface CollapsedKnowledgeCardProps {
  nodeId: string;
  title: string;
  onFocus: (nodeId: string) => void;
  className?: string;
}

export function CollapsedKnowledgeCard({
  nodeId,
  title,
  onFocus,
  className = "",
}: CollapsedKnowledgeCardProps) {
  const handleFocusClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent potential parent handlers
    onFocus(nodeId);
  };

  return (
    <motion.div
      initial={{ opacity: 0.5, scale: 0.9 }}
      animate={{ opacity: 0.7, scale: 1 }} // Slightly different animation for collapsed
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      layout // Enable layout animation
      className={`w-full ${className}`}
    >
      <Card className="p-2 bg-muted/50 hover:bg-muted/80 transition-colors duration-150 cursor-pointer border-dashed border-muted-foreground/30">
        <CardHeader className="flex flex-row items-center justify-between p-1 space-y-0">
          <CardTitle className="text-sm font-medium truncate mr-2" title={title}>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFocusClick}
            aria-label={`Focus graph on ${title}`}
            className="px-2 text-muted-foreground hover:text-foreground"
          >
            <Focus className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </motion.div>
  );
} 