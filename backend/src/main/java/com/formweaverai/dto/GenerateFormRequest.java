package com.formweaverai.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateFormRequest(
  @NotBlank String prompt,
  String model,
  String complexity,
  String tone
) {}
