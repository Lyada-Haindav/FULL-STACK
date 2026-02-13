package com.formweaverai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "form_files")
public class FormFile {
  @Id
  private String id;

  @Field("form_id")
  private String formId;

  @Field("submission_id")
  private String submissionId;

  @Field("field_id")
  private String fieldId;

  private String filename;

  @Field("content_type")
  private String contentType;

  private long size;

  private byte[] data;

  @Field("created_at")
  private Instant createdAt;

  public FormFile() {
    this.createdAt = Instant.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getFormId() { return formId; }
  public void setFormId(String formId) { this.formId = formId; }
  public String getSubmissionId() { return submissionId; }
  public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }
  public String getFieldId() { return fieldId; }
  public void setFieldId(String fieldId) { this.fieldId = fieldId; }
  public String getFilename() { return filename; }
  public void setFilename(String filename) { this.filename = filename; }
  public String getContentType() { return contentType; }
  public void setContentType(String contentType) { this.contentType = contentType; }
  public long getSize() { return size; }
  public void setSize(long size) { this.size = size; }
  public byte[] getData() { return data; }
  public void setData(byte[] data) { this.data = data; }
  public Instant getCreatedAt() { return createdAt; }
}
