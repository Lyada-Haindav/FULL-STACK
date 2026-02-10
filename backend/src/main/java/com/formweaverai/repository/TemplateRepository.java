package com.formweaverai.repository;

import com.formweaverai.model.Template;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateRepository extends JpaRepository<Template, Long> {
  boolean existsByName(String name);
}
