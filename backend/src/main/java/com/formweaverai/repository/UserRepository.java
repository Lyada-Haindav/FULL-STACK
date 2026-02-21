package com.formweaverai.repository;

import com.formweaverai.model.AppUser;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<AppUser, String> {
  Optional<AppUser> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
  Optional<AppUser> findByEmailVerificationToken(String token);
  Optional<AppUser> findByPasswordResetToken(String token);
}
