package com.formweaverai.dto;

import java.util.List;

public record ReorderStepsRequest(List<ReorderItem> steps) {
  public record ReorderItem(String id, Integer orderIndex) {}
}
