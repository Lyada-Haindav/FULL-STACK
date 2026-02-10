package com.formweaverai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "form_steps")
public class FormStep {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "form_id", nullable = false)
  private Form form;

  @Column(nullable = false)
  private String title;

  @Column
  private String description;

  @Column(name = "order_index", nullable = false)
  private Integer orderIndex;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Form getForm() { return form; }
  public void setForm(Form form) { this.form = form; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Integer getOrderIndex() { return orderIndex; }
  public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
