package com.formweaverai.dto;

public record UpdateStepRequest(
  String title,
  String description,
  Integer orderIndex
) {}
