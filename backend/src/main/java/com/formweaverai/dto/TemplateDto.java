package com.formweaverai.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record TemplateDto(
  Long id,
  String name,
  String description,
  String icon,
  String category,
  JsonNode config
) {}
