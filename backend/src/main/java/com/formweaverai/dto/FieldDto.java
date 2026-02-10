package com.formweaverai.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record FieldDto(
  Long id,
  Long stepId,
  String type,
  String label,
  String placeholder,
  String defaultValue,
  boolean required,
  Integer orderIndex,
  JsonNode options,
  JsonNode validationRules
) {}
