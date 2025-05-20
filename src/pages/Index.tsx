
import React, { useState } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { DetailPanel } from '../components/DetailPanel';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { extractYoutubeVideoId } from '../utils/youtubeUtils';

const Index = () => {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleWordSelect = (word: string, translation: string) => {
    setSelectedWord(word);
    setTranslation(translation);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleLoadVideo = () => {
    if (!inputUrl) {
      toast({
        title: "Empty URL",
        description: "Please enter a valid video URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Check if it's a YouTube URL
    const youtubeId = extractYoutubeVideoId(inputUrl);
    if (youtubeId) {
      setVideoUrl(inputUrl);
      setIsVideoLoaded(true);
      toast({
        title: "YouTube Video Loading",
        description: "Your YouTube video is being loaded. Please wait...",
      });
    } else {
      // Otherwise validate as regular URL
      try {
        new URL(inputUrl);
        setVideoUrl(inputUrl);
        setIsVideoLoaded(true);
        toast({
          title: "Video Loading",
          description: "Your video is being loaded. Please wait...",
        });
      } catch (e) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL including http:// or https://",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    // Reset loading after a delay
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // Updated YouTube demo videos that are known to work
  const demoUrls = [
    "https://youtu.be/K3PDRB9R-YI?si=_ZHKj-EBSun9SsSp", // Simple Korean phrase video
    "https://youtu.be/GJMG5Aj9rM8?si=tLn0wP2dtqTRN4KG", // Korean travel phrases
    "https://youtu.be/p0U6qZBLoFs?si=mU0vN3jxpo2A2AE7"  // Korean conversation basics
  ];

  const loadDemoVideo = (url: string) => {
    setInputUrl(url);
    toast({
      title: "Demo video selected",
      description: "Click Load to play this Korean video with subtitles.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <header className="flex justify-center items-center py-2 bg-gradient-to-r from-black to-gray-900">
        <h1 className="text-3xl font-bold text-white">
          <span className="text-red-500">flix</span>fluent
        </h1>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        <div className={`relative ${isPanelOpen ? 'w-full md:w-2/3' : 'w-full'} h-full bg-black`}>
          {!isVideoLoaded ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-2xl font-bold text-center mb-6">Korean Language Learning Video Player</h2>
                
                <div className="space-y-2">
                  <label htmlFor="video-url" className="text-sm font-medium">
                    Enter YouTube URL (Korean Videos Recommended)
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="video-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleLoadVideo} 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load"}
                    </Button>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">Korean Demo Videos</h3>
                  <div className="space-y-2">
                    {demoUrls.map((url, index) => (
                      <button
                        key={index}
                        className="block w-full text-left p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                        onClick={() => loadDemoVideo(url)}
                      >
                        Demo {index + 1}: {
                          index === 0 ? 'Korean Drama Clip' : 
                          index === 1 ? 'Korean Language Lesson' : 
                          'K-pop Music Video'
                        }
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 text-sm text-gray-400">
                  <p>FlixFluent helps you learn Korean by watching videos with interactive subtitles.</p>
                  <p>Hover over Korean words for translations, click for detailed breakdowns.</p>
                  <p className="mt-2 font-semibold">Even if videos don't have subtitles, we'll generate fallback Korean subtitles!</p>
                </div>
              </div>
            </div>
          ) : (
            <VideoPlayer videoUrl={videoUrl} onWordSelect={handleWordSelect} />
          )}
        </div>

        {isPanelOpen && (
          <div className="w-full md:w-1/3 h-full overflow-auto bg-gray-900">
            <DetailPanel 
              selectedWord={selectedWord} 
              translation={translation} 
              onClose={handleClosePanel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
