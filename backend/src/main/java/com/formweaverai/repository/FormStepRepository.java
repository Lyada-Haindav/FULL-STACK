package com.formweaverai.repository;

import com.formweaverai.model.Form;
import com.formweaverai.model.FormStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormStepRepository extends JpaRepository<FormStep, Long> {
  List<FormStep> findAllByFormOrderByOrderIndexAsc(Form form);
  long countByForm(Form form);
}
