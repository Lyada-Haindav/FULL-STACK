package com.formweaverai.dto;

import java.util.List;

public record StepDto(
  Long id,
  Long formId,
  String title,
  String description,
  Integer orderIndex,
  List<FieldDto> fields
) {}
