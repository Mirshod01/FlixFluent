
import React, { useState, useEffect } from 'react';
import { WordDetailsHeader } from './WordDetailsHeader';
import { WordDeconstruction } from './WordDeconstruction';
import { ExampleSentences } from './ExampleSentences';
import { LoadingSpinner } from './LoadingSpinner';
import { analyzeKoreanWord } from '../utils/koreanAnalyzer';

interface DetailPanelProps {
  selectedWord: string;
  translation: string;
  onClose: () => void;
}

interface WordAnalysis {
  romanization: string;
  partOfSpeech: string;
  meaning: string[];
  deconstruction: Array<{
    component: string;
    explanation: string;
  }>;
  examples: Array<{
    korean: string;
    english: string;
  }>;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ selectedWord, translation, onClose }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [analysis, setAnalysis] = useState<WordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    analyzeKoreanWord(selectedWord, translation)
      .then(result => {
        setAnalysis(result);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error analyzing word:", error);
        setIsLoading(false);
      });
  }, [selectedWord, translation]);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="details-panel relative">
      <button onClick={onClose} className="close-button">
        &times;
      </button>
      
      <div className="text-2xl mb-4">Details</div>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : analysis ? (
        <>
          <WordDetailsHeader 
            selectedWord={selectedWord}
            translation={translation}
            romanization={analysis.romanization}
            partOfSpeech={analysis.partOfSpeech}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
          
          <div className="meanings">
            {analysis.meaning.join(', ')}
          </div>
          
          <WordDeconstruction items={analysis.deconstruction} />
          
          <ExampleSentences examples={analysis.examples} />
        </>
      ) : (
        <div>No analysis available for this word.</div>
      )}
    </div>
  );
};
