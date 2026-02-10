package com.formweaverai.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "forms")
public class Form {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private String userId;

  @Column(nullable = false)
  private String title;

  @Column
  private String description;

  @Column(name = "is_published", nullable = false)
  private boolean isPublished = false;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
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
}
