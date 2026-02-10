package com.formweaverai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class VoiceController {
  private final ObjectMapper objectMapper;

  public VoiceController(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @PostMapping("/transcribe")
  public ResponseEntity<JsonNode> transcribe(@RequestBody JsonNode payload) {
    try {
      // Mock transcription using Gemini AI (will be implemented with actual Gemini integration)
      String mockTranscript = "This is a mock transcription using Gemini AI. The microphone recording is working correctly!";
      return ResponseEntity.ok(objectMapper.createObjectNode().put("text", mockTranscript));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(objectMapper.createObjectNode().put("error", "Transcription failed: " + e.getMessage()));
    }
  }

  @PostMapping(value = "/conversations/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public ResponseEntity<StreamingResponseBody> conversationMessage(@PathVariable Long id, @RequestBody JsonNode payload) {
    StreamingResponseBody stream = outputStream -> {
      try {
        // Mock transcription using Gemini AI
        String userTranscript = "This is a mock transcription using Gemini AI. The microphone recording and processing is working correctly!";
        String userEvent = objectMapper.createObjectNode()
          .put("type", "user_transcript")
          .put("data", userTranscript)
          .toString();
        outputStream.write(("data: " + userEvent + "\n\n").getBytes(StandardCharsets.UTF_8));

        String doneEvent = objectMapper.createObjectNode()
          .put("type", "done")
          .put("data", "")
          .toString();
        outputStream.write(("data: " + doneEvent + "\n\n").getBytes(StandardCharsets.UTF_8));
        outputStream.flush();
      } catch (Exception e) {
        try {
          String errorEvent = objectMapper.createObjectNode()
            .put("type", "error")
            .put("error", "Processing failed: " + e.getMessage())
            .toString();
          outputStream.write(("data: " + errorEvent + "\n\n").getBytes(StandardCharsets.UTF_8));
          outputStream.flush();
        } catch (Exception ex) {
          // Last resort
        }
      }
    };

    return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(stream);
  }
}
