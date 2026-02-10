package com.formweaverai.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record UpdateFieldRequest(
  String type,
  String label,
  String placeholder,
  String defaultValue,
  Boolean required,
  Integer orderIndex,
  JsonNode options,
  JsonNode validationRules
) {}
