package com.formweaverai.dto;

public record TemplateDto(
  String id,
  String name,
  String description,
  String icon,
  String category,
  Object config
) {}
