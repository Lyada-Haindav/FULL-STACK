package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "app_users")
public class AppUser {
  @Id
  private String id;

  @Field("email")
  @Indexed(name = "users_email_idx", unique = true)
  private String email;

  @Field("password_hash")
  private String passwordHash;

  @Field("first_name")
  private String firstName;

  @Field("last_name")
  private String lastName;

  @Field("profile_image_url")
  private String profileImageUrl;

  @Field("email_verified")
  private boolean emailVerified;

  @Field("email_verification_token")
  @Indexed(name = "users_email_verification_token_idx")
  private String emailVerificationToken;

  @Field("email_verification_expires_at")
  private Instant emailVerificationExpiresAt;

  @Field("password_reset_token")
  @Indexed(name = "users_password_reset_token_idx")
  private String passwordResetToken;

  @Field("password_reset_expires_at")
  private Instant passwordResetExpiresAt;

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
  public boolean isEmailVerified() { return emailVerified; }
  public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
  public String getEmailVerificationToken() { return emailVerificationToken; }
  public void setEmailVerificationToken(String emailVerificationToken) { this.emailVerificationToken = emailVerificationToken; }
  public Instant getEmailVerificationExpiresAt() { return emailVerificationExpiresAt; }
  public void setEmailVerificationExpiresAt(Instant emailVerificationExpiresAt) { this.emailVerificationExpiresAt = emailVerificationExpiresAt; }
  public String getPasswordResetToken() { return passwordResetToken; }
  public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
  public Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
  public void setPasswordResetExpiresAt(Instant passwordResetExpiresAt) { this.passwordResetExpiresAt = passwordResetExpiresAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

  public void touch() {
    this.updatedAt = Instant.now();
  }
}
