package com.formweaverai.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.formweaverai.util.JsonNodeConverter;
import jakarta.persistence.*;

@Entity
@Table(name = "templates")
public class Template {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String description;

  @Column(nullable = false)
  private String icon;

  @Column(nullable = false)
  private String category;

  @Convert(converter = JsonNodeConverter.class)
  @Column(nullable = false, columnDefinition = "json")
  private JsonNode config;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getIcon() { return icon; }
  public void setIcon(String icon) { this.icon = icon; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public JsonNode getConfig() { return config; }
  public void setConfig(JsonNode config) { this.config = config; }
}
