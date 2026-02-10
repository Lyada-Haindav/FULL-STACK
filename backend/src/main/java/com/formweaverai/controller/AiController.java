package com.formweaverai.controller;

import com.formweaverai.dto.AiGeneratedFormDto;
import com.formweaverai.dto.GenerateFormRequest;
import com.formweaverai.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {
  private final GeminiService geminiService;

  public AiController(GeminiService geminiService) {
    this.geminiService = geminiService;
  }

  @PostMapping("/generate-form")
  public ResponseEntity<AiGeneratedFormDto> generateForm(@Valid @RequestBody GenerateFormRequest request) {
    AiGeneratedFormDto payload = geminiService.generateForm(request.prompt(), request.model(), request.complexity(), request.tone());
    return ResponseEntity.ok(payload);
  }
}
