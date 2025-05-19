export const analyzeKoreanWord = async (word: string, translation: string): Promise<WordAnalysis> => {
  try {
    const PROXY_SERVER_URL = import.meta.env.VITE_BASE_URL;
    const response = await fetch(`${PROXY_SERVER_URL}/analyze-word?word=${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fallback to mock data:", error);
    return {
      romanization: word,
      partOfSpeech: 'unknown',
      meaning: [translation],
      deconstruction: [
        {
          component: word,
          explanation: 'No detailed analysis available.'
        }
      ],
      examples: [
        {
          korean: `예문이 없습니다.`,
          english: 'No examples available.'
        }
      ]
    };
  }
};
