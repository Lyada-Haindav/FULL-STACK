package com.formweaverai.service;

import com.formweaverai.dto.AuthResponse;
import com.formweaverai.dto.LoginRequest;
import com.formweaverai.dto.RegisterRequest;
import com.formweaverai.dto.UserDto;
import com.formweaverai.model.AppUser;
import com.formweaverai.repository.UserRepository;
import com.formweaverai.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
  private static final Duration VERIFICATION_TTL = Duration.ofHours(24);
  private static final Duration PASSWORD_RESET_TTL = Duration.ofMinutes(30);

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final BrevoEmailService brevoEmailService;

  public AuthService(
    UserRepository userRepository,
    PasswordEncoder passwordEncoder,
    JwtService jwtService,
    BrevoEmailService brevoEmailService
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.brevoEmailService = brevoEmailService;
  }

  public Optional<UserDto> register(RegisterRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    Optional<AppUser> existingOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
    if (existingOpt.isPresent()) {
      AppUser existing = existingOpt.get();
      if (existing.isEmailVerified()) {
        return Optional.empty();
      }

      // User exists but is not verified yet: refresh token and resend verification.
      if (StringUtils.hasText(request.firstName())) {
        existing.setFirstName(request.firstName().trim());
      }
      if (StringUtils.hasText(request.lastName())) {
        existing.setLastName(request.lastName().trim());
      }
      existing.setEmailVerificationToken(generateVerificationToken());
      existing.setEmailVerificationExpiresAt(Instant.now().plus(VERIFICATION_TTL));
      existing.touch();
      existing = userRepository.save(existing);

      brevoEmailService.sendVerificationEmail(
        existing.getEmail(),
        displayName(existing),
        existing.getEmailVerificationToken()
      );

      return Optional.of(toDto(existing));
    }

    AppUser user = new AppUser();
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setFirstName(request.firstName() == null ? "" : request.firstName().trim());
    user.setLastName(request.lastName() == null ? "" : request.lastName().trim());
    user.setEmailVerified(false);
    user.setEmailVerificationToken(generateVerificationToken());
    user.setEmailVerificationExpiresAt(Instant.now().plus(VERIFICATION_TTL));
    user.setPasswordResetToken(null);
    user.setPasswordResetExpiresAt(null);
    user.touch();

    user = userRepository.save(user);

    brevoEmailService.sendVerificationEmail(
      user.getEmail(),
      displayName(user),
      user.getEmailVerificationToken()
    );

    return Optional.of(toDto(user));
  }

  public Optional<AuthResponse> login(LoginRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    Optional<AppUser> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
    if (userOpt.isEmpty()) {
      return Optional.empty();
    }

    AppUser user = userOpt.get();
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      return Optional.empty();
    }

    if (!user.isEmailVerified()) {
      throw new IllegalStateException("EMAIL_NOT_VERIFIED");
    }

    return Optional.of(new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toDto(user)));
  }

  public Optional<UserDto> getUser(String userId) {
    return userRepository.findById(userId).map(this::toDto);
  }

  public boolean verifyEmailToken(String token) {
    if (!StringUtils.hasText(token)) {
      return false;
    }

    Optional<AppUser> userOpt = userRepository.findByEmailVerificationToken(token.trim());
    if (userOpt.isEmpty()) {
      return false;
    }

    AppUser user = userOpt.get();
    Instant expiresAt = user.getEmailVerificationExpiresAt();
    if (expiresAt == null || expiresAt.isBefore(Instant.now())) {
      return false;
    }

    user.setEmailVerified(true);
    user.setEmailVerificationToken(null);
    user.setEmailVerificationExpiresAt(null);
    user.setPasswordResetToken(null);
    user.setPasswordResetExpiresAt(null);
    user.touch();
    userRepository.save(user);

    return true;
  }

  public boolean resendVerificationEmail(String email) {
    if (!StringUtils.hasText(email)) {
      return false;
    }

    Optional<AppUser> userOpt = userRepository.findByEmailIgnoreCase(normalizeEmail(email));
    if (userOpt.isEmpty()) {
      return false;
    }

    AppUser user = userOpt.get();
    if (user.isEmailVerified()) {
      return true;
    }

    user.setEmailVerificationToken(generateVerificationToken());
    user.setEmailVerificationExpiresAt(Instant.now().plus(VERIFICATION_TTL));
    user.touch();
    userRepository.save(user);

    brevoEmailService.sendVerificationEmail(
      user.getEmail(),
      displayName(user),
      user.getEmailVerificationToken()
    );

    return true;
  }

  public void requestPasswordReset(String email) {
    if (!StringUtils.hasText(email)) {
      return;
    }

    Optional<AppUser> userOpt = userRepository.findByEmailIgnoreCase(normalizeEmail(email));
    if (userOpt.isEmpty()) {
      return;
    }

    AppUser user = userOpt.get();
    user.setPasswordResetToken(generateVerificationToken());
    user.setPasswordResetExpiresAt(Instant.now().plus(PASSWORD_RESET_TTL));
    user.touch();
    userRepository.save(user);

    brevoEmailService.sendPasswordResetEmail(
      user.getEmail(),
      displayName(user),
      user.getPasswordResetToken()
    );
  }

  public boolean resetPassword(String token, String newPassword) {
    if (!StringUtils.hasText(token) || !StringUtils.hasText(newPassword)) {
      return false;
    }

    Optional<AppUser> userOpt = userRepository.findByPasswordResetToken(token.trim());
    if (userOpt.isEmpty()) {
      return false;
    }

    AppUser user = userOpt.get();
    Instant expiresAt = user.getPasswordResetExpiresAt();
    if (expiresAt == null || expiresAt.isBefore(Instant.now())) {
      return false;
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordResetToken(null);
    user.setPasswordResetExpiresAt(null);
    user.touch();
    userRepository.save(user);
    return true;
  }

  public void ensureDemoUser() {
    String email = System.getenv().getOrDefault("DEMO_USER_EMAIL", "demo@formweaver.local");
    String password = System.getenv().getOrDefault("DEMO_USER_PASSWORD", "demo1234");

    if (userRepository.existsByEmailIgnoreCase(email)) {
      return;
    }

    AppUser user = new AppUser();
    user.setEmail(normalizeEmail(email));
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setFirstName("Demo");
    user.setLastName("User");
    user.setEmailVerified(true);
    user.setEmailVerificationToken(null);
    user.setEmailVerificationExpiresAt(null);
    user.setPasswordResetToken(null);
    user.setPasswordResetExpiresAt(null);
    user.touch();

    userRepository.save(user);
  }

  private String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
  }

  private String generateVerificationToken() {
    return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
  }

  private String displayName(AppUser user) {
    String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
    String last = user.getLastName() == null ? "" : user.getLastName().trim();
    String full = (first + " " + last).trim();
    return full.isEmpty() ? "there" : full;
  }

  private UserDto toDto(AppUser user) {
    return new UserDto(
      user.getId(),
      user.getEmail(),
      user.getFirstName(),
      user.getLastName(),
      user.getProfileImageUrl(),
      user.getCreatedAt(),
      user.getUpdatedAt()
    );
  }
}
