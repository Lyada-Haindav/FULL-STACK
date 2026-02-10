package com.formweaverai.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateStepRequest(
  @NotBlank String title,
  String description
) {}
