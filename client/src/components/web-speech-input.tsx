import { useState } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { cn } from "@/lib/utils";

interface WebSpeechInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  language?: string;
  continuous?: boolean;
  showInterimResults?: boolean;
}

export function WebSpeechInput({ 
  onTranscript, 
  className,
  language = "en-US",
  continuous = false,
  showInterimResults = true
}: WebSpeechInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    state,
    transcript,
    isSupported,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useWebSpeech({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        onTranscript(text);
        setIsProcessing(false);
        if (!continuous) {
          stopListening();
        }
      }
    },
    onError: (error) => {
      console.error("Web Speech error:", error);
      setIsProcessing(false);
    },
    onStateChange: (newState) => {
      if (newState === "idle") {
        setIsProcessing(false);
      } else if (newState === "listening") {
        setIsProcessing(true);
      }
    },
    language,
    continuous,
    interimResults: showInterimResults,
  });

  const handleMicClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isSupported) {
      console.error("Web Speech API not supported in this browser");
      return;
    }

    if (isListening) {
      stopListening();
      setIsProcessing(false);
    } else {
      resetTranscript();
      setIsProcessing(true);
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("opacity-50 cursor-not-allowed", className)}
        disabled
        title="Web Speech API not supported in this browser"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "transition-all duration-300 relative", 
          isListening && "border-red-500 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
          state === "error" && "border-orange-500 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700",
          className
        )}
        onClick={handleMicClick}
        disabled={isProcessing && !isListening}
        title={
          state === "error" 
            ? "Speech recognition error - try again" 
            : isListening 
              ? "Stop recording" 
              : "Start voice input"
        }
      >
        {isProcessing && !isListening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <MicOff className="h-4 w-4" />
          </>
        ) : state === "error" ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* Show interim transcript if enabled */}
      {showInterimResults && transcript && isListening && (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {transcript}
        </div>
      )}
    </div>
  );
}
