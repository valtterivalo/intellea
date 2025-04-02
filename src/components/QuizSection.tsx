'use client';

import React from 'react';
import { useAppStore, CognitionResponse } from '@/store/useAppStore';
import QuizComponent from './QuizComponent';
import { Separator } from "@/components/ui/separator";

// Helper type guard
function isCognitionResponse(output: any): output is CognitionResponse {
    return typeof output === 'object' && output !== null;
}

const QuizSection: React.FC = () => {
    // Select only the quiz data from the store
    const quizData = useAppStore((state) => {
        if (isCognitionResponse(state.output)) {
            return state.output.quiz;
        }
        return undefined;
    });

    // Only render if quizData exists
    if (!quizData) {
        return null;
    }

    return (
        <>
            <Separator />
            <section>
                <h2 className="text-2xl font-semibold mb-4">Check Understanding</h2>
                <QuizComponent quizData={quizData} />
            </section>
        </>
    );
};

export default React.memo(QuizSection); 