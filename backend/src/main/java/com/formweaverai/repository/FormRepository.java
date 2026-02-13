package com.formweaverai.repository;

import com.formweaverai.model.Form;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FormRepository extends MongoRepository<Form, String> {
  List<Form> findAllByUserIdOrderByUpdatedAtDesc(String userId);
  long countByIsPublishedTrue();
}
