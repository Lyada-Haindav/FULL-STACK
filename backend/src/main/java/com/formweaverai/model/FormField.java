package com.formweaverai.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.formweaverai.util.JsonNodeConverter;
import jakarta.persistence.*;

@Entity
@Table(name = "form_fields")
public class FormField {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "step_id", nullable = false)
  private FormStep step;

  @Column(nullable = false)
  private String type;

  @Column(nullable = false)
  private String label;

  @Column
  private String placeholder;

  @Column(name = "default_value")
  private String defaultValue;

  @Column(nullable = false)
  private boolean required = false;

  @Column(name = "order_index", nullable = false)
  private Integer orderIndex;

  @Convert(converter = JsonNodeConverter.class)
  @Column(columnDefinition = "json")
  private JsonNode options;

  @Convert(converter = JsonNodeConverter.class)
  @Column(name = "validation_rules", columnDefinition = "json")
  private JsonNode validationRules;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public FormStep getStep() { return step; }
  public void setStep(FormStep step) { this.step = step; }
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
  public JsonNode getOptions() { return options; }
  public void setOptions(JsonNode options) { this.options = options; }
  public JsonNode getValidationRules() { return validationRules; }
  public void setValidationRules(JsonNode validationRules) { this.validationRules = validationRules; }
}
