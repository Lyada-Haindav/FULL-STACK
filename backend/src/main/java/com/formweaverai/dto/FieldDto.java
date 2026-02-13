package com.formweaverai.dto;

public record FieldDto(
  String id,
  String stepId,
  String type,
  String label,
  String placeholder,
  String defaultValue,
  boolean required,
  Integer orderIndex,
  Object options,
  Object validationRules
) {}
