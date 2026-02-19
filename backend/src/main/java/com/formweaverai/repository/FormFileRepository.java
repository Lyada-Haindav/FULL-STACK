package com.formweaverai.repository;

import com.formweaverai.model.FormFile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FormFileRepository extends MongoRepository<FormFile, String> {
  List<FormFile> findAllBySubmissionId(String submissionId);
  List<FormFile> findAllByFormId(String formId);
  void deleteAllByFormId(String formId);
}
