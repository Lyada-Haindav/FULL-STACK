package com.formweaverai.repository;

import com.formweaverai.model.FormStep;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FormStepRepository extends MongoRepository<FormStep, String> {
  List<FormStep> findAllByFormIdOrderByOrderIndexAsc(String formId);
  void deleteAllByFormId(String formId);
  long countByFormId(String formId);
}
