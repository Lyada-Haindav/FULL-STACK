package com.formweaverai.dto;

import java.time.Instant;
import java.util.List;

public record FormWithStepsDto(
  Long id,
  String userId,
  String title,
  String description,
  boolean isPublished,
  Instant createdAt,
  Instant updatedAt,
  List<StepDto> steps
) {}
