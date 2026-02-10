package com.formweaverai.repository;

import com.formweaverai.model.Form;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormRepository extends JpaRepository<Form, Long> {
  List<Form> findAllByUserIdOrderByUpdatedAtDesc(String userId);
  long countByIsPublishedTrue();
}
