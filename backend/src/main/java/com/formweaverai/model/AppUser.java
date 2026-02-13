package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "app_users")
public class AppUser {
  @Id
  private String id;

  @Field("email")
  private String email;

  @Field("password_hash")
  private String passwordHash;

  @Field("first_name")
  private String firstName;

  @Field("last_name")
  private String lastName;

  @Field("profile_image_url")
  private String profileImageUrl;

  @Field("created_at")
  private Instant createdAt;

  @Field("updated_at")
  private Instant updatedAt;

  public AppUser() {
    Instant now = Instant.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }
  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }
  public String getProfileImageUrl() { return profileImageUrl; }
  public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
