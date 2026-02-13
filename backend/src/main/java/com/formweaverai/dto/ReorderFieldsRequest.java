package com.formweaverai.dto;

import java.util.List;

public record ReorderFieldsRequest(List<ReorderItem> fields) {
  public record ReorderItem(String id, Integer orderIndex) {}
}
