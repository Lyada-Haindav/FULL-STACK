package com.formweaverai.repository;

import com.formweaverai.model.Form;
import com.formweaverai.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
  List<Submission> findAllByFormOrderBySubmittedAtDesc(Form form);
  List<Submission> findByFormIdOrderBySubmittedAtDesc(Long formId);
  long countByFormId(Long formId);
  long countBySubmittedAtAfter(LocalDateTime dateTime);
}
