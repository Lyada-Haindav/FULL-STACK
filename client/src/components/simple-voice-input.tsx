import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleVoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  language?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function SimpleVoiceInput({ 
  onTranscript, 
  className,
  language = "en-IN"
}: SimpleVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [requiresSecureContext, setRequiresSecureContext] = useState(false);
  const [error, setError] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const hasSecureMicrophoneContext = window.isSecureContext || isLocalhost;
    setRequiresSecureContext(!hasSecureMicrophoneContext);

    if (!hasSecureMicrophoneContext) {
      setIsSupported(false);
      setError("Microphone needs HTTPS");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError("");
        setTranscript("");
        setIsProcessing(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          onTranscript(finalTranscript.trim());
          // Auto-stop after getting final result
          setTimeout(() => {
            stopListening();
          }, 100);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        const message =
          event.error === "not-allowed"
            ? "Allow microphone permission"
            : event.error === "no-speech"
              ? "No speech detected"
              : event.error === "audio-capture"
                ? "No microphone found"
                : event.error || "Speech recognition error";
        setError(message);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, onTranscript]);

  const startListening = useCallback(() => {
    if (requiresSecureContext) {
      setError("Microphone needs HTTPS");
      return;
    }
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser");
      return;
    }
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setError("");
        recognitionRef.current.start();
        
        // Auto-stop after 10 seconds as a safety measure
        timeoutRef.current = setTimeout(() => {
          if (isListening) {
            stopListening();
          }
        }, 10000);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setError("Failed to start speech recognition");
      }
    }
  }, [isListening, isSupported, requiresSecureContext]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn("Speech recognition already stopped:", error);
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsListening(false);
    setIsProcessing(false);
  }, [isListening]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  if (!isSupported || requiresSecureContext) {
    const title = requiresSecureContext
      ? "Microphone requires HTTPS. Open the app with a secure domain to use voice input."
      : "Speech recognition not supported in this browser";

    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "cursor-not-allowed border-border/70 bg-muted/35 text-muted-foreground opacity-80 touch-manipulation",
          className,
        )}
        disabled
        title={title}
        aria-label={title}
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
          "relative touch-manipulation transition-all duration-200", 
          isListening && "border-red-500 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
          error && "border-orange-500 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700",
          className
        )}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        disabled={isProcessing}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
        title={
          error 
            ? `Error: ${error} - Click to retry` 
            : isListening 
              ? "Click to stop or right-click to force stop" 
              : "Start voice input"
        }
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <MicOff className="h-4 w-4" />
          </>
        ) : error ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* Show interim transcript */}
      {transcript && isListening && (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {transcript}
        </div>
      )}
    </div>
  );
}
