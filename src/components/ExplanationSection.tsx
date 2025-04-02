'use client';

import React from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

// Helper type guard (Consider exporting from store or a utils file)
function isCognitionResponse(output: any): output is CognitionResponse {
    return typeof output === 'object' && output !== null && 'explanationMarkdown' in output;
}

// --- Replicate Custom Markdown Components from OutputRenderer --- 
// (Ideally, extract these to a shared utility file)
const CustomParagraph = ({ children }: { children?: React.ReactNode }) => {
    return <p className="leading-relaxed">{children}</p>; 
};
const CustomH1 = ({ children }: { children?: React.ReactNode }) => {
    return <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>;
};
const CustomH2 = ({ children }: { children?: React.ReactNode }) => {
    return <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>;
};
const CustomH3 = ({ children }: { children?: React.ReactNode }) => {
    return <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>;
};
const markdownComponents: Components = {
    p: CustomParagraph,
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
};
// --- End Custom Markdown Components ---

const ExplanationSection: React.FC = () => {
    // Select only the explanationMarkdown from the store
    const explanationMarkdown = useAppStore((state) => {
        if (isCognitionResponse(state.output)) {
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