package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "forms")
@CompoundIndex(name = "forms_user_updated_idx", def = "{'user_id': 1, 'updated_at': -1}")
public class Form {
  @Id
  private String id;

  @Field("user_id")
  private String userId;

  private String title;

  private String description;

  @Field("is_published")
  private boolean isPublished = false;

  @Field("created_at")
  private Instant createdAt;

  @Field("updated_at")
  private Instant updatedAt;

  private Object theme;

  public Form() {
    Instant now = Instant.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public boolean isPublished() { return isPublished; }
  public void setPublished(boolean published) { isPublished = published; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public Object getTheme() { return theme; }
  public void setTheme(Object theme) { this.theme = theme; }
}
