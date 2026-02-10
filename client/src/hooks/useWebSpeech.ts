/**
 * React hook for Web Speech API recognition
 * Provides browser-native speech-to-text functionality
 */
import { useState, useCallback, useRef, useEffect } from "react";

export type SpeechState = "idle" | "listening" | "processing" | "error";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useWebSpeech(options: {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: SpeechState) => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
} = {}) {
  const [state, setState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const {
    onTranscript,
    onError,
    onStateChange,
    language = "en-US",
    continuous = false,
    interimResults = true,
  } = options;

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setState("listening");
      onStateChange?.("listening");
      finalTranscriptRef.current = "";
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + " ";
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript.trim());
      
      // Call onTranscript with final results
      if (finalTranscript.trim()) {
        onTranscript?.(finalTranscript.trim(), true);
      }
      
      // Also call with interim results if enabled
      if (interimResults && interimTranscript.trim()) {
        onTranscript?.(fullTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error, event.message);
      setState("error");
      onStateChange?.("error");
      onError?.(event.error || "Unknown speech recognition error");
    };

    recognition.onend = () => {
      // Always set state to idle when recognition ends
      setState("idle");
      onStateChange?.("idle");
    };
  }, [continuous, interimResults, language, onTranscript, onError, onStateChange, state]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      onError?.("Speech recognition not supported");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      onError?.("Failed to start speech recognition");
    }
  }, [isSupported, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn("Speech recognition already stopped:", error);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  return {
    state,
    transcript,
    isSupported,
    isListening: state === "listening",
    startListening,
    stopListening,
    resetTranscript,
  };
}
