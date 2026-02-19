package com.formweaverai.repository;

import com.formweaverai.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface SubmissionRepository extends MongoRepository<Submission, String> {
  List<Submission> findAllByFormIdOrderBySubmittedAtDesc(String formId);
  void deleteAllByFormId(String formId);
  long countByFormId(String formId);
  long countBySubmittedAtAfter(Instant dateTime);
}
