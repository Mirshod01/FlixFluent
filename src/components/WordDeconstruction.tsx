
import React from 'react';

interface DeconstructionItem {
  component: string;
  explanation: string;
}

interface WordDeconstructionProps {
  items: DeconstructionItem[];
}

export const WordDeconstruction: React.FC<WordDeconstructionProps> = ({ items }) => {
  return (
    <div className="deconstruction-section">
      <h3>Deconstruction</h3>
      <div className="component">
        {items.map((item, index) => (
          <div key={index} className="component-item">
            <div className="component-korean">{item.component}</div>
            <div className="component-explanation">{item.explanation}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
