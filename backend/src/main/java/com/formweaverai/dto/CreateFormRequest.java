package com.formweaverai.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFormRequest(
  @NotBlank String title,
  String description,
  Boolean isPublished
) {}
