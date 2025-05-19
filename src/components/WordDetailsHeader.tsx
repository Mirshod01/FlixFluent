
import React from 'react';
import { FaHeart, FaRegHeart, FaEllipsisV } from 'react-icons/fa';

interface WordDetailsHeaderProps {
  selectedWord: string;
  translation: string;
  romanization: string;
  partOfSpeech: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const WordDetailsHeader: React.FC<WordDetailsHeaderProps> = ({
  selectedWord,
  translation,
  romanization,
  partOfSpeech,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div className="word-header">
      <div className="korean-title">{selectedWord}</div>
      <div className="romanization">{romanization}</div>
      <div className="part-of-speech">{partOfSpeech}</div>
      <div className="translation">{translation}</div>
      <button onClick={onToggleFavorite} className="ml-auto">
        {isFavorite ? <FaHeart color="#d20000" /> : <FaRegHeart />}
      </button>
      <button className="ml-2">
        <FaEllipsisV />
      </button>
    </div>
  );
};
