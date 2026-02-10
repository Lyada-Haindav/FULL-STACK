package com.formweaverai.dto;

import java.time.Instant;

public record FormDto(
  Long id,
  String userId,
  String title,
  String description,
  boolean isPublished,
  Instant createdAt,
  Instant updatedAt
) {}
