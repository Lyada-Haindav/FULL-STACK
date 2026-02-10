package com.formweaverai.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.formweaverai.util.JsonNodeConverter;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "submissions")
public class Submission {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "form_id", nullable = false)
  private Form form;

  @Convert(converter = JsonNodeConverter.class)
  @Column(nullable = false, columnDefinition = "json")
  private JsonNode data;

  @Column(name = "submitted_at", nullable = false)
  private Instant submittedAt;

  @PrePersist
  void onCreate() {
    submittedAt = Instant.now();
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Form getForm() { return form; }
  public void setForm(Form form) { this.form = form; }
  public JsonNode getData() { return data; }
  public void setData(JsonNode data) { this.data = data; }
  public Instant getSubmittedAt() { return submittedAt; }
}
