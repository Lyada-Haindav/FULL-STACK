package com.formweaverai.repository;

import com.formweaverai.model.Template;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TemplateRepository extends MongoRepository<Template, String> {
  boolean existsByName(String name);
}
