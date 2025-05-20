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
    const response = await fetch(`${PROXY_SERVER_URL}/subtitles?videoId=${videoId}`);
    if (response.status !== 200) {
      console.error(`Subtitle API returned status: ${response.status}`);
      return generateFallbackSubtitles(videoId);
    }

    const json = await response.json();
    if (!json.subtitles || json.subtitles.length === 0) {
      console.error("No subtitles found in response.");
      return generateFallbackSubtitles(videoId);
    }
    const subtitles = json.subtitles.map((subtitle: any) => ({
      start: subtitle.start,
      end: subtitle.start + subtitle.dur,
      text: subtitle.text
    }));

    if (subtitles || subtitles.length !== 0) {
      console.error("No subtitles found in response.");
      //add here translation subtitles
      console.log('subtitles', subtitles)
      return subtitles
    }

    const data = await response.json();
    if (data.error) {
      console.error("Error from subtitle API:", data.error);
      return generateFallbackSubtitles(videoId);
    }

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

  console.log('videoId', videoId)
  return [];
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


