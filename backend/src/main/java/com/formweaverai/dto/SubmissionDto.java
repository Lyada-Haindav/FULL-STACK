package com.formweaverai.dto;

import java.time.Instant;

public record SubmissionDto(
  String id,
  String formId,
  Object data,
  Instant submittedAt
) {}
