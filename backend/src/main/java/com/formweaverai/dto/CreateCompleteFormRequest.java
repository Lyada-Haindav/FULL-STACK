package com.formweaverai.dto;

import java.util.List;

public record CreateCompleteFormRequest(
  String title,
  String description,
  List<StepInput> steps
) {
  public record StepInput(
    String title,
    String description,
    List<FieldInput> fields
  ) {}

  public record FieldInput(
    String type,
    String label,
    String placeholder,
    Boolean required,
    Object options
  ) {}
}
