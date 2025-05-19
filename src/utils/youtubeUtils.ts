// YouTube utility functions for extracting video IDs and subtitles

import fallbackSubtitles from "./fallbackSubtitles";

// Set this to your deployed proxy server URL
const PROXY_SERVER_URL = import.meta.env.VITE_BASE_URL;
// For example:
// const PROXY_SERVER_URL = 'https://korean-subtitles-proxy.onrender.com';
// const PROXY_SERVER_URL = 'https://your-app-name.vercel.app';

/**
 * Extract YouTube video ID from URL or use direct ID
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  // Handle direct video IDs
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url;
  }

  // Handle YouTube URLs
  try {
    const urlObj = new URL(url);

    // youtube.com/watch?v=VIDEO_ID format
    if (urlObj.hostname.includes('youtube.com')) {
      const params = new URLSearchParams(urlObj.search);
      return params.get('v');
    }

    // youtu.be/VIDEO_ID format
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1);
    }

    return null;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
};

/**
 * Fetch subtitles directly from YouTube API without relying on language detection first
 */
export const fetchYoutubeSubtitles = async (videoId: string, language = 'auto'): Promise<Array<{ start: number, end: number, text: string }>> => {
  try {
    // console.log(`Fetching subtitles for YouTube video: ${videoId}, language: ${language}`);

    // Skip the language detection step as it's causing issues
    // Just fetch subtitles directly with the auto parameter
    // const response = await fetch(`${PROXY_SERVER_URL}/api/subtitles?videoId=${videoId}&lang=${language}`);
    // const response = await fetch(`${PROXY_SERVER_URL}/subtitles?videoId=${videoId}`);
    let response;

    // console.log('\n\n\n', response, 'response\n\n\n');

    if (!response.ok) {
      console.error(`Subtitle API returned status: ${response.status}`);
      const errorData = await response.json();
      // console.log("Subtitle API error details:", errorData);

      // If no subtitles are found, try to generate them with OpenAI
      // console.log("No subtitles found, generating fallback subtitles");
      return generateFallbackSubtitles(videoId);
    }

    const data = await response.json();
    if (data.error) {
      console.error("Error from subtitle API:", data.error);
      return generateFallbackSubtitles(videoId);
    }

    if (!data.subtitles || data.subtitles.length === 0) {
      console.error(`No subtitles found for language: ${language}`);
      return generateFallbackSubtitles(videoId);
    }

    // console.log(`Successfully retrieved ${data.subtitles.length} subtitles`);

    return data.subtitles.map((subtitle: any) => ({
      start: parseFloat(subtitle.start),
      end: parseFloat(subtitle.start) + parseFloat(subtitle.dur || "5"),
      text: subtitle.text
    }));
  } catch (error) {
    console.error("Error fetching YouTube subtitles:", error);
    return generateFallbackSubtitles(videoId);
  }
};

/**
 * Try to fetch subtitles in multiple languages
 * First try the requested language, then Korean, then English, then auto
 */
export const fetchSubtitlesWithFallback = async (videoId: string, preferredLanguage = 'auto'): Promise<Array<{ start: number, end: number, text: string }>> => {
  const languagesToTry = [
    preferredLanguage,
    'ko', // Try Korean
    'en', // Try English
    'auto' // Try auto-detect
  ].filter((lang, index, self) => self.indexOf(lang) === index); // Remove duplicates

  for (const lang of languagesToTry) {
    try {
      // console.log(`Trying to fetch subtitles in language: ${lang}`);
      // const response = await fetch(`${PROXY_SERVER_URL}/subtitles?videoId=${videoId}&lang=${lang}`);
      let response;

      if (response.ok) {
        const data = await response.json();
        if (data.subtitles && data.subtitles.length > 0) {
          // console.log(`Successfully found subtitles in language: ${lang}`);
          return data.subtitles.map((subtitle: any) => ({
            start: parseFloat(subtitle.start),
            end: parseFloat(subtitle.start) + parseFloat(subtitle.dur || "5"),
            text: subtitle.text
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching subtitles in ${lang}:`, error);
    }
  }

  // If all attempts fail, generate fallback subtitles
  // console.log("All subtitle fetch attempts failed, using fallback subtitles");
  return generateFallbackSubtitles(videoId);
};

/**
 * Generate fallback subtitles when none are available from YouTube
 */
async function generateFallbackSubtitles(videoId: string): Promise<Array<{ start: number, end: number, text: string }>> {
  // console.log("Generating fallback subtitles for video:", videoId);

  // For demo purposes, return some basic Korean phrases as fallback subtitles
  // const fallbackSubtitles = [
  //   { start: 0, end: 5, text: "안녕하세요" },
  //   { start: 5, end: 10, text: "한국어 학습에 오신 것을 환영합니다" },
  //   { start: 10, end: 15, text: "이 비디오는 한국어 학습을 위한 것입니다" },
  //   { start: 15, end: 20, text: "오늘 우리는 기본 표현을 배울 것입니다" },
  //   { start: 20, end: 25, text: "감사합니다" },
  //   { start: 25, end: 30, text: "이것은 여러분이 한국어를 배우는데 도움이 될 것입니다" },
  //   { start: 30, end: 35, text: "좋은 하루 되세요" },
  //   { start: 35, end: 40, text: "다음 시간에 뵙겠습니다" },
  //   { start: 40, end: 45, text: "안녕히 계세요" },
  // ];

  return fallbackSubtitles;
}

/**
 * Fetch word translation using OpenAI API via proxy server
 */
export const fetchWordTranslation = async (word: string): Promise<{
  translatedText: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples?: Array<{ korean: string, english: string }>
}> => {
  try {
    // console.log(`Translating word: ${word} using OpenAI API`);

    // const response = await fetch(`${PROXY_SERVER_URL}/translate-openai?word=${encodeURIComponent(word)}`);
    let response;
    const data = await response.json();

    if (data.error) {
      console.error("Error from OpenAI translation API:", data.error);
      return { translatedText: "Translation not available" };
    }

    // Return the structured translation object
    return {
      translatedText: data.translation.translatedText || "No translation",
      pronunciation: data.translation.pronunciation,
      partOfSpeech: data.translation.partOfSpeech,
      examples: data.translation.examples || [],
    };
  } catch (error) {
    console.error("Error fetching translation from OpenAI:", error);
    return {
      translatedText: "Translation not available"
    };
  }
};

// Process Korean text to identify Korean words
export const processKoreanText = (text: string): string => {
  // Regex to match Korean words (Hangul characters)
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g;

  // Replace Korean words with spans
  return text.replace(koreanRegex, (match) => match);
};


