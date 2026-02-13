package com.formweaverai.dto;

import java.util.List;

public record StepDto(
  String id,
  String formId,
  String title,
  String description,
  Integer orderIndex,
  List<FieldDto> fields
) {}
