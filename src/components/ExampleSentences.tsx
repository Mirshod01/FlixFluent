
import React from 'react';

interface ExampleSentence {
  korean: string;
  english: string;
}

interface ExampleSentencesProps {
  examples: ExampleSentence[];
}

export const ExampleSentences: React.FC<ExampleSentencesProps> = ({ examples }) => {
  if (!examples || examples.length === 0) {
    return (
      <div className="my-4">
        <h3 className="text-lg font-semibold mb-2">Example Sentences</h3>
        <p className="text-gray-500 italic">No examples available</p>
      </div>
    );
  }
  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2">Example Sentences</h3>
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="font-medium text-lg mb-1 text-black">{example.korean}</div>
            <div className="text-gray-600">{example.english}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
