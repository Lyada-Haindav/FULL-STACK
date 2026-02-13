package com.formweaverai.repository;

import com.formweaverai.model.FormField;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FormFieldRepository extends MongoRepository<FormField, String> {
  List<FormField> findAllByStepIdOrderByOrderIndexAsc(String stepId);
  long countByStepId(String stepId);
}
