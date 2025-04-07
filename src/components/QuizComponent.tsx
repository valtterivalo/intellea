'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from 'lucide-react';

interface QuizData {
  question: string;
  options: string[]; // e.g., ["A) Option 1", "B) Option 2", ...]
  correctAnswerLetter?: string; // Make optional if not already
}

interface QuizComponentProps {
  quizData: QuizData;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quizData }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === quizData.correctAnswerLetter?.toUpperCase()) {
      setFeedback("Correct!");
    } else {
      setFeedback(`Incorrect. The correct answer was ${quizData.correctAnswerLetter?.toUpperCase()}.`);
    }
  };

  const getOptionLetter = (option: string): string => {
    // Handles "A)" or "A." format
    return option?.match(/^([A-Za-z])[\.\)]/)?.[1] || '';
  };

  const getOptionText = (option: string): string => {
      // Remove A) or A. prefix and any leading space
      return option.replace(/^([A-Z])[\.\)]\s*/i, '');
  }

  // Safely get the correct answer letter
  const correctAnswerLetter = (quizData.correctAnswerLetter?.toUpperCase()) || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{quizData.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quizData.options && Array.isArray(quizData.options) && quizData.options.map((option, index) => {
            const letter = getOptionLetter(option);
            const text = getOptionText(option);
            const isSelected = selectedOption === letter;
            const isCorrect = letter === correctAnswerLetter;
            
            let variant: "default" | "secondary" | "outline" | "destructive" | "ghost" = "outline";
            let icon = null;
            let buttonTextClass = "text-card-foreground";

            if (isAnswered) {
              if (isSelected) {
                variant = isCorrect ? "default" : "destructive";
                icon = isCorrect ? <Check className="ml-auto h-5 w-5 text-green-500" /> : <X className="ml-auto h-5 w-5 text-white" />;
                buttonTextClass = isCorrect ? "text-primary-foreground" : "text-destructive-foreground";
              } else if (isCorrect) {
                variant = "secondary";
                icon = <Check className="ml-auto h-5 w-5 text-green-600" />;
                buttonTextClass = "text-secondary-foreground";
              } else {
                variant = "secondary";
                buttonTextClass = "text-muted-foreground";
              }
            } else {
              variant = isSelected ? "default" : "outline";
              buttonTextClass = isSelected ? "text-primary-foreground" : "text-card-foreground";
            }

            return (
              <Button
                key={index}
                variant={variant}
                onClick={() => handleOptionSelect(letter)}
                className={`w-full justify-start h-auto py-3 px-4 ${isAnswered ? 'opacity-90' : ''}`}
                disabled={isAnswered}
              >
                <span className={`font-mono mr-3 ${isSelected && !isAnswered ? 'text-primary-foreground' : isSelected ? buttonTextClass : 'text-muted-foreground'}`}>{letter})</span> 
                <span className={`flex-grow text-left whitespace-normal ${buttonTextClass}`}>{text}</span>
                {icon}
              </Button>
            );
          })}

          {!isAnswered ? (
            <Button
              onClick={checkAnswer}
              disabled={!selectedOption}
              className="mt-4 w-full sm:w-auto"
            >
              Check Answer
            </Button>
          ) : feedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-center font-medium p-2 rounded-md ${selectedOption === correctAnswerLetter ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}
            >
              {feedback}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizComponent; 