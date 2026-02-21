package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "templates")
public class Template {
  @Id
  private String id;

  @Indexed(name = "templates_name_idx")
  private String name;

  private String description;

  private String icon;

  @Indexed(name = "templates_category_idx")
  private String category;

  private Object config;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getIcon() { return icon; }
  public void setIcon(String icon) { this.icon = icon; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public Object getConfig() { return config; }
  public void setConfig(Object config) { this.config = config; }
}
