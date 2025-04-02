'use client';

import React from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import KnowledgeCard from './KnowledgeCard'; // Import the new component

// Helper type guard
function isCognitionResponse(output: any): output is CognitionResponse {
    return typeof output === 'object' && output !== null;
}

// Renamed component
const KnowledgeCardsSection: React.FC = () => {
    // Select knowledgeCards from the store
    const knowledgeCards = useAppStore((state) => {
        if (isCognitionResponse(state.output)) {
            // Access knowledgeCards instead of keyTerms
            return state.output.knowledgeCards;
        }
        return undefined;
    });

    // Only render if knowledgeCards exist and have items
    if (!knowledgeCards || knowledgeCards.length === 0) {
        return null;
    }

    return (
        <>
            <Separator />
            <section>
                {/* Updated section title */}
                <h2 className="text-2xl font-semibold mb-4">Knowledge Cards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Map over knowledgeCards */} 
                    {knowledgeCards.map((card, index) => (
                        <motion.div
                            key={card.id} // Use card.id as key
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                        >
                            {/* 
                                Placeholder for the actual KnowledgeCard component.
                                We will create this component next and pass the 'card' object as a prop.
                                Example: <KnowledgeCard card={card} /> 
                            */}
                            {/* <Card className="h-full flex flex-col py-1 gap-0">
                                <CardHeader className="p-1 pb-1 flex-shrink-0">
                                    <CardTitle className="text-lg">{card.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-1 pt-1 flex-grow">
                                    <p className="text-sm text-muted-foreground">{card.description.substring(0, 100)}{card.description.length > 100 ? '...' : ''}</p> 
                                </CardContent>
                            </Card> */}
                            {/* Use the actual KnowledgeCard component */}
                            <KnowledgeCard card={card} />
                        </motion.div>
                    ))}
                </div>
            </section>
        </>
    );
};

// Update export
export default React.memo(KnowledgeCardsSection); 