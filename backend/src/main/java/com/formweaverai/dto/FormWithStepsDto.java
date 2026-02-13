package com.formweaverai.dto;

import java.time.Instant;
import java.util.List;

public record FormWithStepsDto(
  String id,
  String userId,
  String title,
  String description,
  boolean isPublished,
  Instant createdAt,
  Instant updatedAt,
  List<StepDto> steps,
  Object theme
) {}
