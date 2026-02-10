package com.formweaverai.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record SubmissionDto(
  Long id,
  Long formId,
  JsonNode data,
  Instant submittedAt
) {}
