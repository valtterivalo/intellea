'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { isIntelleaResponse } from '@/store/utils';
import QuizComponent from './QuizComponent';
import { Separator } from "@/components/ui/separator";


const QuizSection: React.FC = () => {
    // Select only the quiz data from the store
    const quizData = useAppStore((state) => {
        if (isIntelleaResponse(state.output)) {
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