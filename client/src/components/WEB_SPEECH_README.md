# Web Speech API Implementation

## Overview

This implementation provides browser-native speech-to-text functionality using the Web Speech API, with automatic fallback to the original voice recording system for browsers that don't support Web Speech.

## Components

### 1. `useWebSpeech` Hook (`/hooks/useWebSpeech.ts`)
- **Purpose**: React hook for Web Speech API integration
- **Features**:
  - Browser support detection
  - Real-time speech recognition
  - Interim and final results
  - Error handling and fallback
  - Multiple language support
  - Continuous and non-continuous modes

### 2. `WebSpeechInput` Component (`/components/web-speech-input.tsx`)
- **Purpose**: Simple Web Speech API input component
- **Features**:
  - Visual feedback for recording state
  - Interim transcript display
  - Error state handling
  - Browser compatibility check

### 3. `SmartVoiceInput` Component (`/components/smart-voice-input.tsx`)
- **Purpose**: Intelligent voice input with automatic fallback
- **Features**:
  - **Primary**: Web Speech API (when supported)
  - **Fallback**: Traditional voice recording + backend transcription
  - Automatic method switching on errors
  - Visual indication of current method
  - Seamless user experience

## Browser Support

### Web Speech API Support
- **Chrome/Edge**: Full support
- **Firefox**: Limited support
- **Safari**: Partial support (requires HTTPS)
- **Mobile**: Varies by device and browser

### Fallback Support
- All browsers with microphone access
- Uses MediaRecorder API + backend transcription
- OpenAI Whisper integration

## Usage Examples

### Basic Web Speech Input
```tsx
import { WebSpeechInput } from "@/components/web-speech-input";

<WebSpeechInput 
  onTranscript={(text) => console.log(text)}
  language="en-US"
  continuous={false}
/>
```

### Smart Voice Input (Recommended)
```tsx
import { SmartVoiceInput } from "@/components/smart-voice-input";

<SmartVoiceInput 
  onTranscript={(text) => setValue(fieldName, text)}
  conversationId={1}
  language="en-US"
  showInterimResults={true}
/>
```

## Configuration Options

### Web Speech Hook Options
```typescript
{
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: SpeechState) => void;
  language?: string;           // Default: "en-US"
  continuous?: boolean;        // Default: false
  interimResults?: boolean;    // Default: true
}
```

### Component Props
```typescript
{
  onTranscript: (text: string) => void;
  className?: string;
  language?: string;           // WebSpeechInput, SmartVoiceInput
  continuous?: boolean;        // WebSpeechInput, SmartVoiceInput
  showInterimResults?: boolean; // WebSpeechInput, SmartVoiceInput
  conversationId?: number;      // SmartVoiceInput only
}
```

## States

### Speech States
- `idle`: Not recording
- `listening`: Actively recording speech
- `processing`: Processing audio (fallback only)
- `error`: Speech recognition failed

### Visual Indicators
- **Red pulsing dot**: Currently recording
- **Spinner**: Processing audio
- **Orange border**: Error state
- **Disabled icon**: Not supported

## Implementation Details

### Web Speech API Flow
1. Request microphone access
2. Initialize SpeechRecognition
3. Start listening on user interaction
4. Process interim and final results
5. Handle errors and fallback

### Fallback Flow
1. Web Speech API not available or failed
2. Use MediaRecorder API
3. Record audio blob
4. Send to backend `/api/conversations/{id}/messages`
5. Backend transcribes using OpenAI Whisper
6. Return transcript via SSE

## Security Considerations

### HTTPS Requirement
- Web Speech API requires HTTPS in production
- Local development works on HTTP
- Safari requires HTTPS for all features

### Microphone Permissions
- Must be triggered by user gesture
- Permissions persisted per origin
- Handle permission denials gracefully

## Performance Notes

### Web Speech API
- **Pros**: Real-time, no backend cost, low latency
- **Cons**: Browser-dependent, limited languages

### Fallback Recording
- **Pros**: Universal support, high accuracy
- **Cons**: Backend cost, higher latency, requires internet

## Troubleshooting

### Common Issues

1. **"Web Speech API not supported"**
   - Use SmartVoiceInput for automatic fallback
   - Check browser compatibility

2. **"Microphone permission denied"**
   - Ensure user interaction trigger
   - Check browser permissions

3. **"No speech detected"**
   - Check microphone hardware
   - Try different language setting

4. **"HTTPS required"**
   - Deploy with SSL certificate
   - Use localhost for development

### Debug Mode
Enable console logging to see detailed speech recognition events:
```typescript
const webSpeech = useWebSpeech({
  onTranscript: (text, isFinal) => {
    console.log(`Transcript: ${text} (Final: ${isFinal})`);
  },
  onError: (error) => {
    console.error('Speech error:', error);
  }
});
```

## Future Enhancements

- **Language Auto-Detection**: Detect spoken language automatically
- **Custom Commands**: Voice commands for form navigation
- **Noise Cancellation**: Audio processing for noisy environments
- **Offline Support**: Local speech recognition models
- **Voice Profiles**: User-specific voice adaptation
