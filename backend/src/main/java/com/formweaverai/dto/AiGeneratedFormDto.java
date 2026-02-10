package com.formweaverai.dto;

import java.util.List;

public record AiGeneratedFormDto(
  String title,
  String description,
  List<AiStepDto> steps
) {
  public record AiStepDto(
    String title,
    String description,
    List<AiFieldDto> fields
  ) {}

  public record AiFieldDto(
    String type,
    String label,
    String placeholder,
    boolean required,
    List<OptionDto> options
  ) {}

  public record OptionDto(String label, String value) {}
}
