
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { koreanDictionary } from './koreanDictionary';

interface SubtitleDisplayProps {
  subtitle: string;
  onWordSelect: (word: string, translation: string) => void;
}


const segmentKoreanText = (text: string): string[] => {
  // This is a simplified segmentation for demo
  // In a real app, you would use a proper Korean tokenizer
  const words = text.split(/\s+/);
  return words.filter(word => word.length > 0);
};

export const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ subtitle, onWordSelect }) => {
  // Check if the subtitle contains Korean characters
  const containsKorean = (text: string): boolean => {
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
    return koreanRegex.test(text);
  };

  const isKoreanSubtitle = containsKorean(subtitle);
  
  // For English subtitles, just display them normally
  if (!isKoreanSubtitle) {
    return (
      <div className="subtitles-container bg-black/70 p-4 rounded-md max-w-3xl mx-auto">
        <div className="subtitle-text text-white text-2xl text-center">
          {subtitle}
        </div>
      </div>
    );
  }

  // For Korean subtitles, segment them into interactive words
  const words = segmentKoreanText(subtitle);
  
  return (
    <div className="subtitles-container bg-black/70 p-4 rounded-md max-w-3xl mx-auto">
      <div className="subtitle-text text-white text-2xl text-center flex flex-wrap justify-center gap-1">
        {words.map((word, index) => {
          const translation = koreanDictionary[word] || 'Translation not available';
          
          return (
            <HoverCard key={index} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <span 
                  className="subtitle-word relative cursor-pointer hover:bg-red-500/30 px-1 py-0.5 rounded transition-colors"
                  onClick={() => onWordSelect(word, translation)}
                >
                  {word}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2 bg-black/90 border-none text-white shadow-lg">
                <div className="text-sm">{translation}</div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
};

