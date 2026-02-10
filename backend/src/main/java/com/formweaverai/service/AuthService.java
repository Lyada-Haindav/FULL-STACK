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

import java.util.Optional;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public Optional<AuthResponse> register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      return Optional.empty();
    }
    AppUser user = new AppUser();
    user.setEmail(request.email());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setFirstName(request.firstName() == null ? "" : request.firstName());
    user.setLastName(request.lastName() == null ? "" : request.lastName());
    user = userRepository.save(user);
    String token = jwtService.generateToken(user.getId(), user.getEmail());
    return Optional.of(new AuthResponse(token, toDto(user)));
  }

  public Optional<AuthResponse> login(LoginRequest request) {
    return userRepository.findByEmail(request.email())
      .filter(user -> passwordEncoder.matches(request.password(), user.getPasswordHash()))
      .map(user -> new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toDto(user)));
  }

  public Optional<UserDto> getUser(Long userId) {
    return userRepository.findById(userId).map(this::toDto);
  }

  public void ensureDemoUser() {
    String email = System.getenv().getOrDefault("DEMO_USER_EMAIL", "demo@formweaver.local");
    String password = System.getenv().getOrDefault("DEMO_USER_PASSWORD", "demo1234");
    if (userRepository.existsByEmail(email)) {
      return;
    }
    AppUser user = new AppUser();
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setFirstName("Demo");
    user.setLastName("User");
    userRepository.save(user);
  }

  private UserDto toDto(AppUser user) {
    return new UserDto(
      user.getId().toString(),
      user.getEmail(),
      user.getFirstName(),
      user.getLastName(),
      user.getProfileImageUrl(),
      user.getCreatedAt(),
      user.getUpdatedAt()
    );
  }
}
