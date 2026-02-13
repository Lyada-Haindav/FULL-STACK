package com.formweaverai.repository;

import com.formweaverai.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SubmissionRepository extends MongoRepository<Submission, String> {
  List<Submission> findAllByFormIdOrderBySubmittedAtDesc(String formId);
  long countByFormId(String formId);
  long countBySubmittedAtAfter(LocalDateTime dateTime);
}
