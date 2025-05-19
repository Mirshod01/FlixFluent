import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaExpand, FaCompress } from 'react-icons/fa';
import { SubtitleDisplay } from './SubtitleDisplay';
import { useToast } from '../components/ui/use-toast';
import { extractYoutubeVideoId, fetchYoutubeSubtitles } from '../utils/youtubeUtils';
import { loadYouTubeAPI } from '@/utils/loadYouTubeAPI';

interface VideoPlayerProps {
  videoUrl: string;
  onWordSelect: (word: string, translation: string) => void;
}

declare global {
  interface Window { 
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onWordSelect }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitles, setSubtitles] = useState<TextTrack | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(true);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [youtubeSubtitles, setYoutubeSubtitles] = useState<Array<{start: number, end: number, text: string}>>([]);
  const [youtubeSubtitleIntervalId, setYoutubeSubtitleIntervalId] = useState<number | null>(null);
  const [subtitleLanguage] = useState('auto'); // Keep default to auto-detect
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  useEffect(() => {
  if (youtubeSubtitles.length > 0) {
    // console.log("▶️ Starting subtitle tracker with", youtubeSubtitles.length, "items");
    startSubtitleTracker();
  }
}, [youtubeSubtitles]);

  // Load YouTube iframe API
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Define the callback function
      window.onYouTubeIframeAPIReady = () => {
        // console.log("YouTube iframe API is ready");
        setYoutubeReady(true);
      };
    } else {
      // If the API is already loaded, just set ready state
      if (window.YT && window.YT.Player) {
        // console.log("YouTube iframe API already loaded");
        setYoutubeReady(true);
      }
    }

    // Cleanup function
    return () => {
      if (youtubeSubtitleIntervalId) {
        clearInterval(youtubeSubtitleIntervalId);
      }
    };
  }, []);
  // Initialize YouTube player when ready and URL is a YouTube URL
useEffect(() => {
  let isMounted = true;
  
  if (!videoUrl) return;

  const youtubeId = extractYoutubeVideoId(videoUrl);
  if (youtubeId) {
    setIsYouTubeVideo(true);
    loadYouTubeAPI().then((YT) => {
      if (!isMounted) return;
      setYoutubeReady(true);

      if (youtubeContainerRef.current && !youtubePlayerRef.current) {   
             youtubePlayerRef.current = new YT.Player(youtubeContainerRef.current, {

          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            'cc_load_policy': 0,
            'modestbranding': 1,
            'rel': 0,
            'controls': 0
          },
          events: {
            onReady: onYoutubeReady,
            onStateChange: onYoutubeStateChange,
            onError: onYoutubeError
          }
        });
      } else if (youtubePlayerRef.current) {
        youtubePlayerRef.current.loadVideoById(youtubeId);
      }

      fetchYoutubeSubtitles(youtubeId, subtitleLanguage)
        .then(subtitleData => {
          // console.log(`Received ${subtitleData.length} subtitle entries`);
          setYoutubeSubtitles(subtitleData);
          // startSubtitleTracker();
        });
    });
  } else {
    setIsYouTubeVideo(false);
  }
  return () => {
    isMounted = false;
    if (youtubeSubtitleIntervalId) {
      clearInterval(youtubeSubtitleIntervalId);
    }
  };
}, [videoUrl, subtitleLanguage]);

  const onYoutubeError = (event: any) => {
    // YouTube player error codes
    // 2 - The request contains an invalid parameter value
    // 5 - The requested content cannot be played in an HTML5 player
    // 100 - The video requested was not found
    // 101/150 - The owner of the requested video does not allow it to be played in embedded players
    
    const errorCode = event.data;
    let errorMessage = "An unknown error occurred";
    
    switch (errorCode) {
      case 2:
        errorMessage = "Invalid video parameters";
        break;
      case 5:
        errorMessage = "This video cannot be played in this player";
        break;
      case 100:
        errorMessage = "Video not found";
        break;
      case 101:
      case 150:
        errorMessage = "This video cannot be embedded";
        break;
    }
    
    console.error(`YouTube player error: ${errorCode} - ${errorMessage}`);
    setYoutubeError(errorMessage);
    
    toast({
      title: "YouTube Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Start tracking subtitles based on video time
  const startSubtitleTracker = () => {
    // Clear any existing interval
    if (youtubeSubtitleIntervalId) {
      clearInterval(youtubeSubtitleIntervalId);
    }
    
    // Create new interval to check current time and update subtitle
    const intervalId = window.setInterval(() => {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          updateCurrentSubtitle(currentTime);
        } catch (error) {
          console.error("Error getting current time from YouTube player:", error);
        }
      }
    }, 500);
    
    setYoutubeSubtitleIntervalId(intervalId);
  };
  
  // Update the current subtitle based on video time
  const updateCurrentSubtitle = (currentTime: number) => {
    for (const subtitle of youtubeSubtitles) {
      if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
        setCurrentSubtitle(subtitle.text);
        return;
      }
    }
    setCurrentSubtitle('');
  };

  // Handle direct video URL (non-YouTube)
  useEffect(() => {
    if (videoRef.current && videoUrl && !isYouTubeVideo) {
      videoRef.current.src = videoUrl;
      setIsVideoLoaded(false);
      setIsPlaying(false);
      setCurrentSubtitle('');
    }
  }, [videoUrl, isYouTubeVideo]);

  // Handle video events for direct video playback
  useEffect(() => {
    if (isYouTubeVideo || !videoRef.current) return;

    const video = videoRef.current;
    
    const onTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(currentProgress) ? 0 : currentProgress);
      setCurrentTime(video.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsVideoLoaded(true);
      
      // Check for text tracks after metadata is loaded
      setTimeout(() => {
        if (video.textTracks && video.textTracks.length > 0) {
          const track = video.textTracks[0];
          track.mode = 'hidden'; // Hide default subtitles
          setSubtitles(track);
          
          track.addEventListener('cuechange', () => {
            if (track.activeCues && track.activeCues.length > 0) {
              const cue = track.activeCues[0] as VTTCue;
              setCurrentSubtitle(cue.text);
            } else {
              setCurrentSubtitle('');
            }
          });
          
          toast({
            title: "Subtitles detected",
            description: "Subtitles from the video have been loaded successfully.",
          });
        } else {
          toast({
            title: "No subtitles found",
            description: "This video does not have embedded subtitles. Upload a subtitle file or try a different video.",
            variant: "destructive",
          });
        }
      }, 1000); // Small delay to ensure tracks are loaded
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      
      // Clean up subtitle event listeners
      if (subtitles) {
        subtitles.removeEventListener('cuechange', () => {});
      }
    };
  }, [subtitles, isYouTubeVideo, toast]);

  // YouTube player event handlers
  const onYoutubeReady = (event: any) => {
    try {
      const player = event.target;
      setDuration(player.getDuration());
      setIsVideoLoaded(true);
      
      // Start YouTube progress tracker
      startYoutubeProgressTracker();
      
      // Try to play the video automatically
      player.playVideo();
      
      toast({
        title: "YouTube video loaded",
        description: "YouTube video is ready to play.",
      });
    } catch (error) {
      console.error("Error handling YouTube ready event:", error);
      toast({
        title: "YouTube Error",
        description: "Error initializing YouTube player.",
        variant: "destructive",
      });
    }
  };

  const onYoutubeStateChange = (event: any) => {
    try {
      const playerState = event.data;
      
      // YT.PlayerState.PLAYING = 1
      if (playerState === 1) {
        setIsPlaying(true);
      } 
      // YT.PlayerState.PAUSED = 2
      else if (playerState === 2) {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error handling YouTube state change:", error);
    }
  };

  // Track YouTube video progress
  const startYoutubeProgressTracker = () => {
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          const duration = youtubePlayerRef.current.getDuration();
          const progress = (currentTime / duration) * 100;
          
          setCurrentTime(currentTime);
          setProgress(isNaN(progress) ? 0 : progress);
        } catch (error) {
          console.error("Error tracking YouTube progress:", error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  // Toggle play/pause for both regular video and YouTube
  const togglePlay = () => {
    if (isYouTubeVideo) {
      if (youtubePlayerRef.current) {
        try {
          if (isPlaying) {
            youtubePlayerRef.current.pauseVideo();
          } else {
            youtubePlayerRef.current.playVideo();
          }
        } catch (error) {
          console.error("Error toggling YouTube play state:", error);
          toast({
            title: "Playback error",
            description: "Could not control YouTube playback.",
            variant: "destructive",
          });
        }
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          toast({
            title: "Playback error",
            description: "Could not play the video. " + error.message,
            variant: "destructive",
          });
        });
      }
    }
  };

  // Seek video (works for both regular video and YouTube)
  const seekVideo = (amount: number) => {
    if (isYouTubeVideo) {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          youtubePlayerRef.current.seekTo(currentTime + amount, true);
        } catch (error) {
          console.error("Error seeking YouTube video:", error);
        }
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  // Progress bar click handler (works for both types)
  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentClicked = clickPosition / rect.width;
    
    if (isYouTubeVideo) {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getDuration === 'function') {
        try {
          const newTime = youtubePlayerRef.current.getDuration() * percentClicked;
          youtubePlayerRef.current.seekTo(newTime, true);
        } catch (error) {
          console.error("Error seeking YouTube video:", error);
        }
      }
    } else if (videoRef.current) {
      const newTime = videoRef.current.duration * percentClicked;
      videoRef.current.currentTime = newTime;
    }
  };

  // Change playback rate (works for both types)
  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const newIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[newIndex];
    
    setPlaybackRate(newRate);
    
    if (isYouTubeVideo) {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.setPlaybackRate === 'function') {
        try {
          youtubePlayerRef.current.setPlaybackRate(newRate);
        } catch (error) {
          console.error("Error setting YouTube playback rate:", error);
        }
      }
    } else if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  // Toggle fullscreen (works for both types)
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle subtitle visibility
  const handleSubtitleToggle = () => {
    setIsSubtitleVisible(!isSubtitleVisible);
  };

  return (
    <div ref={containerRef} className="video-container relative w-full h-full">
      {isYouTubeVideo ? (
        youtubeError ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white p-6">
            <p className="text-xl font-bold text-red-500 mb-2">YouTube Error</p>
            <p className="mb-4">{youtubeError}</p>
            <p>Please try another video or check the URL.</p>
          </div>
        ) : (
          <div ref={youtubeContainerRef} className="youtube-player w-full h-full" />
        )
      ) : (
        <video 
          ref={videoRef} 
          className="video-player w-full h-full object-contain bg-black"
          playsInline
        />
      )}
      
      {isSubtitleVisible && currentSubtitle && (
        <SubtitleDisplay 
          subtitle={currentSubtitle} 
          onWordSelect={onWordSelect} 
        />
      )}
      
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-8">
        <div 
          ref={progressRef} 
          className="progress-bar h-2 bg-gray-700 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="progress-bar-fill h-full bg-red-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="controls flex justify-between items-center px-4 py-2">
          <div className="flex items-center space-x-4">
            <button className="control-button text-white hover:text-red-500 transition" onClick={() => seekVideo(-10)}>
              <FaBackward size={18} />
            </button>
            
            <button className="control-button text-white hover:text-red-500 transition" onClick={togglePlay}>
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
            
            <button className="control-button text-white hover:text-red-500 transition" onClick={() => seekVideo(10)}>
              <FaForward size={18} />
            </button>
            
            <span className="time-display text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="playback-rate text-white text-sm font-bold hover:text-red-500 transition"
              onClick={changePlaybackRate}
            >
              {playbackRate}x
            </button>
            
            <button
              className="subtitle-toggle text-white hover:text-red-500 transition"
              onClick={handleSubtitleToggle}
            >
              {isSubtitleVisible ? 'Hide CC' : 'Show CC'}
            </button>
            
            <button 
              className="control-button text-white hover:text-red-500 transition" 
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
