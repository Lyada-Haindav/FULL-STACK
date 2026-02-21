package com.formweaverai.controller;

import com.formweaverai.dto.LoginRequest;
import com.formweaverai.dto.MessageResponse;
import com.formweaverai.dto.ForgotPasswordRequest;
import com.formweaverai.dto.RegisterRequest;
import com.formweaverai.dto.ResendVerificationRequest;
import com.formweaverai.dto.ResetPasswordRequest;
import com.formweaverai.dto.UserDto;
import com.formweaverai.dto.VerifyEmailRequest;
import com.formweaverai.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AuthService authService;
  private final String appFrontendUrl;

  public AuthController(AuthService authService, @Value("${app.frontend-url:}") String appFrontendUrl) {
    this.authService = authService;
    this.appFrontendUrl = normalizeOptionalUrl(appFrontendUrl);
  }

  @PostMapping("/auth/register")
  public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
    return authService.register(request)
      .map(user -> ResponseEntity.status(HttpStatus.CREATED).body(
        new MessageResponse("Registration successful. Please check your email for verification.")
      ))
      .orElseGet(() -> ResponseEntity.ok().body(
        new MessageResponse("Account already exists. Please sign in.")
      ));
  }

  @PostMapping("/auth/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
    try {
      var result = authService.login(request);
      if (result.isPresent()) {
        return ResponseEntity.ok(result.get());
      }
    } catch (IllegalStateException ex) {
      if ("EMAIL_NOT_VERIFIED".equals(ex.getMessage())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(new MessageResponse("Email not verified. Please check your inbox."));
      }
    }

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
      .body(new MessageResponse("Invalid email or password."));
  }

  @GetMapping(value = "/auth/verify-email", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
    boolean verified = authService.verifyEmailToken(token);

    if (!appFrontendUrl.isBlank()) {
      HttpHeaders headers = new HttpHeaders();
      headers.setLocation(URI.create(appFrontendUrl + "/verify-email?status=" + (verified ? "success" : "error")));
      return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    if (!verified) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("""
        <html><body style=\"font-family:Arial,sans-serif;padding:24px;color:#111827;\">
        <h2>Email verification failed</h2>
        <p>This verification link is invalid or expired. Please request a new one from login.</p>
        </body></html>
        """);
    }

    return ResponseEntity.ok("""
      <html><body style=\"font-family:Arial,sans-serif;padding:24px;color:#111827;\">
      <h2>Email verified successfully</h2>
      <p>Your account is now active. You can return to the app and sign in.</p>
      </body></html>
      """);
  }

  @PostMapping("/auth/verify-email")
  public ResponseEntity<MessageResponse> verifyEmailApi(@Valid @RequestBody VerifyEmailRequest request) {
    boolean verified = authService.verifyEmailToken(request.token());
    if (!verified) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new MessageResponse("Verification link is invalid or expired."));
    }
    return ResponseEntity.ok(new MessageResponse("Email verified successfully. You can sign in now."));
  }

  @PostMapping("/auth/resend-verification")
  public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
    boolean sent = authService.resendVerificationEmail(request.email());
    if (!sent) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new MessageResponse("No user found with that email."));
    }

    return ResponseEntity.ok(new MessageResponse("Verification email sent."));
  }

  @PostMapping("/auth/forgot-password")
  public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.requestPasswordReset(request.email());
    // Always return the same response to avoid leaking whether an email is registered.
    return ResponseEntity.ok(new MessageResponse("If that email exists, a reset link has been sent."));
  }

  @GetMapping(value = "/auth/reset-password", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> resetPasswordForm(@RequestParam("token") String token) {
    return ResponseEntity.ok("""
      <html><body style="font-family:Arial,sans-serif;padding:24px;color:#111827;">
      <h2>Reset your password</h2>
      <form method="post" action="/api/auth/reset-password" style="max-width:360px;">
        <input type="hidden" name="token" value="%s" />
        <label style="display:block;margin-bottom:8px;">New Password</label>
        <input type="password" name="password" minlength="6" required style="width:100%%;padding:10px;border:1px solid #d1d5db;border-radius:8px;margin-bottom:12px;" />
        <button type="submit" style="padding:10px 16px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;">Update Password</button>
      </form>
      </body></html>
      """.formatted(token == null ? "" : token));
  }

  @PostMapping(value = "/auth/reset-password", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> resetPasswordSubmit(@RequestParam("token") String token, @RequestParam("password") String password) {
    boolean ok = authService.resetPassword(token, password);
    if (!ok) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("""
        <html><body style="font-family:Arial,sans-serif;padding:24px;color:#111827;">
        <h2>Password reset failed</h2>
        <p>This reset link is invalid or expired.</p>
        </body></html>
        """);
    }
    return ResponseEntity.ok("""
      <html><body style="font-family:Arial,sans-serif;padding:24px;color:#111827;">
      <h2>Password updated</h2>
      <p>Your password has been reset successfully. You can now return to login.</p>
      </body></html>
      """);
  }

  @PostMapping("/auth/reset-password")
  public ResponseEntity<MessageResponse> resetPasswordApi(@Valid @RequestBody ResetPasswordRequest request) {
    boolean ok = authService.resetPassword(request.token(), request.password());
    if (!ok) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse("Invalid or expired reset token."));
    }
    return ResponseEntity.ok(new MessageResponse("Password reset successful."));
  }

  @GetMapping("/auth/user")
  public ResponseEntity<UserDto> getUser(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return authService.getUser(authentication.getName())
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

  private String normalizeOptionalUrl(String value) {
    if (value == null || value.isBlank()) {
      return "";
    }
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
