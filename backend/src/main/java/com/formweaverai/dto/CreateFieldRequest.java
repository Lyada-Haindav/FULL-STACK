package com.formweaverai.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;

public record CreateFieldRequest(
  @NotBlank String type,
  @NotBlank String label,
  String placeholder,
  String defaultValue,
  Boolean required,
  JsonNode options,
  JsonNode validationRules
) {}
