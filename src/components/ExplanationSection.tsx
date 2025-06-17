'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { markdownComponents } from './MarkdownComponents';



const ExplanationSection: React.FC = () => {
    // Select only the explanationMarkdown from the store
    const explanationMarkdown = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
            return state.output.explanationMarkdown;
        }
        return null; // Return null if not available
    });

    // Only render if explanationMarkdown exists
    if (!explanationMarkdown) {
        return null;
    }

    return (
        <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose dark:prose-invert max-w-none"
        >
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {explanationMarkdown}
            </ReactMarkdown>
        </motion.section>
    );
};

export default React.memo(ExplanationSection);
