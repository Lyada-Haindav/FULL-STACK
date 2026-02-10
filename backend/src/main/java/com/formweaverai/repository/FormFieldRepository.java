package com.formweaverai.repository;

import com.formweaverai.model.FormField;
import com.formweaverai.model.FormStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormFieldRepository extends JpaRepository<FormField, Long> {
  List<FormField> findAllByStepOrderByOrderIndexAsc(FormStep step);
  long countByStep(FormStep step);
}
