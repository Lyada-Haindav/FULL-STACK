import { useState } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { cn } from "@/lib/utils";

interface SmartVoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  conversationId?: number;
  language?: string;
  continuous?: boolean;
  showInterimResults?: boolean;
}

export function SmartVoiceInput({ 
  onTranscript, 
  className,
  conversationId = 1,
  language = "en-US",
  continuous = false,
  showInterimResults = true
}: SmartVoiceInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWebSpeechApi, setUseWebSpeechApi] = useState(true);
  
  // Web Speech API hook
  const webSpeech = useWebSpeech({
    onTranscript: (text: string, isFinal: boolean) => {
      if (isFinal) {
        onTranscript(text);
        setIsProcessing(false);
        if (!continuous) {
          webSpeech.stopListening();
        }
      }
    },
    onError: (error: string) => {
      console.error("Web Speech error:", error);
      setIsProcessing(false);
      // Fallback to traditional voice recording
      setUseWebSpeechApi(false);
    },
    onStateChange: (newState: string) => {
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

  // Traditional voice recording hooks
  const recorder = useVoiceRecorder();
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      onTranscript(text);
      setIsProcessing(false);
    },
    onError: (err) => {
      console.error("Voice recording error:", err);
      setIsProcessing(false);
    }
  });

  const handleMicClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (useWebSpeechApi && webSpeech.isSupported) {
      // Use Web Speech API
      if (webSpeech.isListening) {
        webSpeech.stopListening();
        setIsProcessing(false);
      } else {
        webSpeech.resetTranscript();
        setIsProcessing(true);
        webSpeech.startListening();
      }
    } else {
      // Use traditional voice recording
      if (recorder.state === "recording") {
        setIsProcessing(true);
        const blob = await recorder.stopRecording();
        try {
          await stream.streamVoiceResponse(
            `/api/conversations/${conversationId}/messages`,
            blob
          );
        } catch (e) {
          console.error("Failed to transcribe", e);
          setIsProcessing(false);
        }
      } else {
        await recorder.startRecording();
      }
    }
  };

  // Handle right-click to force stop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      if (useWebSpeechApi && webSpeech.isSupported) {
        webSpeech.stopListening();
        setIsProcessing(false);
      } else if (recorder.state === "recording") {
        recorder.stopRecording();
        setIsProcessing(false);
      }
    }
  };

  const isRecording = useWebSpeechApi ? webSpeech.isListening : recorder.state === "recording";
  const isSupported = useWebSpeechApi ? webSpeech.isSupported : true;
  const transcript = useWebSpeechApi ? webSpeech.transcript : "";

  // Show error state if neither method is available
  if (!isSupported && !useWebSpeechApi) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("opacity-50 cursor-not-allowed", className)}
        disabled
        title="Voice input not available"
      >
        <AlertCircle className="h-4 w-4" />
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
          isRecording && "border-red-500 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
          webSpeech.state === "error" && "border-orange-500 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700",
          className
        )}
        onClick={handleMicClick}
        onContextMenu={handleContextMenu}
        disabled={isProcessing && !isRecording}
        title={
          webSpeech.state === "error" 
            ? "Web Speech error - using fallback" 
            : isRecording 
              ? "Click to stop or right-click to force stop" 
              : useWebSpeechApi
                ? "Start voice input (Web Speech)"
                : "Start voice input (recording)"
        }
      >
        {isProcessing && !isRecording ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <MicOff className="h-4 w-4" />
          </>
        ) : webSpeech.state === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* Show interim transcript if using Web Speech */}
      {useWebSpeechApi && showInterimResults && transcript && isRecording && (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {transcript}
        </div>
      )}
      
      {/* Show method indicator */}
      <div className="text-xs text-muted-foreground">
        {useWebSpeechApi ? "Web Speech" : "Recording"}
      </div>
    </div>
  );
}
