package com.formweaverai.dto;

public record UpdateFormRequest(
  String title,
  String description,
  Boolean isPublished
) {}
