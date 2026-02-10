package com.formweaverai.controller;

import com.formweaverai.dto.AuthResponse;
import com.formweaverai.dto.LoginRequest;
import com.formweaverai.dto.RegisterRequest;
import com.formweaverai.dto.UserDto;
import com.formweaverai.security.JwtService;
import com.formweaverai.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthService authService;
  private final JwtService jwtService;

  public AuthController(AuthService authService, JwtService jwtService) {
    this.authService = authService;
    this.jwtService = jwtService;
  }

  @PostMapping("/auth/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return authService.register(request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT).build());
  }

  @PostMapping("/auth/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
  }

  @GetMapping("/auth/user")
  public ResponseEntity<UserDto> getUser(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    Long userId = Long.parseLong(authentication.getName());
    return authService.getUser(userId)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
  }

  @GetMapping("/login")
  public void loginRedirect(HttpServletResponse response) throws IOException {
    response.sendRedirect("/login");
  }

  @GetMapping("/logout")
  public void logoutRedirect(HttpServletResponse response) throws IOException {
    response.sendRedirect("/");
  }
}
