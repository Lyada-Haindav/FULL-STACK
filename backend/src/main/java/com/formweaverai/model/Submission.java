package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "submissions")
public class Submission {
  @Id
  private String id;

  @Field("form_id")
  private String formId;

  private Object data;

  @Field("submitted_at")
  private Instant submittedAt;

  public Submission() {
    submittedAt = Instant.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getFormId() { return formId; }
  public void setFormId(String formId) { this.formId = formId; }
  public Object getData() { return data; }
  public void setData(Object data) { this.data = data; }
  public Instant getSubmittedAt() { return submittedAt; }
}
