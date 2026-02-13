package com.formweaverai.dto;

import java.time.Instant;

public record FormDto(
  String id,
  String userId,
  String title,
  String description,
  boolean isPublished,
  Instant createdAt,
  Instant updatedAt,
  Object theme
) {}
