package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "form_fields")
public class FormField {
  @Id
  private String id;

  @Field("step_id")
  private String stepId;

  private String type;

  private String label;

  private String placeholder;

  @Field("default_value")
  private String defaultValue;

  private boolean required = false;

  @Field("order_index")
  private Integer orderIndex;

  private Object options;

  @Field("validation_rules")
  private Object validationRules;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getStepId() { return stepId; }
  public void setStepId(String stepId) { this.stepId = stepId; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
  public String getPlaceholder() { return placeholder; }
  public void setPlaceholder(String placeholder) { this.placeholder = placeholder; }
  public String getDefaultValue() { return defaultValue; }
  public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }
  public boolean isRequired() { return required; }
  public void setRequired(boolean required) { this.required = required; }
  public Integer getOrderIndex() { return orderIndex; }
  public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
  public Object getOptions() { return options; }
  public void setOptions(Object options) { this.options = options; }
  public Object getValidationRules() { return validationRules; }
  public void setValidationRules(Object validationRules) { this.validationRules = validationRules; }
}
