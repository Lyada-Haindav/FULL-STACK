package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "form_steps")
@CompoundIndex(name = "steps_form_order_idx", def = "{'form_id': 1, 'order_index': 1}")
public class FormStep {
  @Id
  private String id;

  @Field("form_id")
  private String formId;

  private String title;

  private String description;

  @Field("order_index")
  private Integer orderIndex;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getFormId() { return formId; }
  public void setFormId(String formId) { this.formId = formId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Integer getOrderIndex() { return orderIndex; }
  public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
