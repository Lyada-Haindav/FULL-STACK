package com.formweaverai.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class BrevoEmailService {
  private static final Logger logger = LoggerFactory.getLogger(BrevoEmailService.class);
  private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

  private final JavaMailSender mailSender;
  private final TaskExecutor taskExecutor;
  private final String fromEmail;
  private final String smtpUsername;
  private final String appBaseUrl;
  private final HttpClient httpClient;
  private final String brevoApiKey;

  public BrevoEmailService(
    JavaMailSender mailSender,
    @Qualifier("appTaskExecutor") TaskExecutor taskExecutor,
    @Value("${app.mail.from:no-reply@formweaver.local}") String fromEmail,
    @Value("${spring.mail.username:}") String smtpUsername,
    @Value("${BREVO_API_KEY:}") String brevoApiKey,
    @Value("${app.base-url:http://localhost:8080}") String appBaseUrl
  ) {
    this.mailSender = mailSender;
    this.taskExecutor = taskExecutor;
    this.fromEmail = fromEmail;
    this.smtpUsername = smtpUsername == null ? "" : smtpUsername.trim();
    this.appBaseUrl = trimTrailingSlash(appBaseUrl);
    String normalizedMailPassword = sanitizeBrevoPassword();
    this.brevoApiKey = resolveBrevoApiKey(brevoApiKey, normalizedMailPassword);
    this.httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5))
      .build();
  }

  public void sendVerificationEmail(String recipientEmail, String recipientName, String token) {
    String verificationUrl = appBaseUrl + "/api/auth/verify-email?token=" + token;

    String subject = "Confirm your FormFlow AI account";
    String htmlBody = """
      <div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;\">
        <h2 style=\"margin-bottom:8px;\">Confirm your email</h2>
        <p>Hi %s,</p>
        <p>Click the button below to confirm your account. This link expires in 24 hours.</p>
        <p style=\"margin:20px 0;\">
          <a href=\"%s\" style=\"display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;\">Confirm Email</a>
        </p>
        <p>If the button does not work, copy this URL:</p>
        <p><a href=\"%s\">%s</a></p>
      </div>
      """.formatted(escape(recipientName), verificationUrl, verificationUrl, verificationUrl);

    taskExecutor.execute(() -> sendHtmlEmail(recipientEmail, subject, htmlBody, "verification"));
  }

  public void sendPasswordResetEmail(String recipientEmail, String recipientName, String token) {
    String resetUrl = appBaseUrl + "/api/auth/reset-password?token=" + token;

    String subject = "Reset your FormFlow AI password";
    String htmlBody = """
      <div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;\">
        <h2 style=\"margin-bottom:8px;\">Reset your password</h2>
        <p>Hi %s,</p>
        <p>Click below to set a new password. This link expires in 30 minutes.</p>
        <p style=\"margin:20px 0;\">
          <a href=\"%s\" style=\"display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;\">Reset Password</a>
        </p>
        <p>If the button does not work, copy this URL:</p>
        <p><a href=\"%s\">%s</a></p>
      </div>
      """.formatted(escape(recipientName), resetUrl, resetUrl, resetUrl);

    taskExecutor.execute(() -> sendHtmlEmail(recipientEmail, subject, htmlBody, "password-reset"));
  }

  private void sendHtmlEmail(String recipientEmail, String subject, String htmlBody, String kind) {
    if (!brevoApiKey.isBlank()) {
      try {
        sendWithBrevoApi(recipientEmail, subject, htmlBody);
        return;
      } catch (IOException | InterruptedException ex) {
        if (ex instanceof InterruptedException) {
          Thread.currentThread().interrupt();
        }
        logger.warn("Brevo API send failed for {} email to {}, falling back to SMTP", kind, recipientEmail, ex);
      } catch (RuntimeException ex) {
        logger.warn("Brevo API rejected {} email to {}, falling back to SMTP", kind, recipientEmail, ex);
      }
    }

    String primaryFrom = resolveFromEmail();
    try {
      sendHtmlEmailWithFrom(primaryFrom, recipientEmail, subject, htmlBody);
    } catch (MailException | MessagingException ex) {
      // If sender is misconfigured/unverified, retry once with SMTP login as From.
      if (!smtpUsername.isBlank() && !smtpUsername.equalsIgnoreCase(primaryFrom)) {
        try {
          sendHtmlEmailWithFrom(smtpUsername, recipientEmail, subject, htmlBody);
          logger.warn("Primary sender failed for {} email, fallback sender used: {}", kind, smtpUsername);
          return;
        } catch (MailException | MessagingException fallbackEx) {
          logger.error("Failed to send {} email to {} using primary and fallback senders", kind, recipientEmail, fallbackEx);
          return;
        }
      }

      logger.error("Failed to send {} email to {}", kind, recipientEmail, ex);
    }
  }

  private String trimTrailingSlash(String value) {
    if (value == null || value.isBlank()) {
      return "http://localhost:8080";
    }
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }

  private String sanitizeBrevoPassword() {
    if (!(mailSender instanceof JavaMailSenderImpl sender)) {
      return "";
    }

    String password = sender.getPassword();
    if (password == null) {
      return "";
    }
    String trimmed = password.trim();
    if (trimmed.startsWith("api-key=")) {
      trimmed = trimmed.substring("api-key=".length());
      sender.setPassword(trimmed);
    }
    return trimmed;
  }

  private String escape(String value) {
    if (value == null || value.isBlank()) {
      return "there";
    }
    return value
      .replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;")
      .replace("\"", "&quot;")
      .replace("'", "&#39;");
  }

  private String resolveFromEmail() {
    String configured = normalizeEmailLike(fromEmail);
    if (!configured.isBlank() && !configured.endsWith("@formweaver.local")) {
      return configured;
    }
    if (!smtpUsername.isBlank()) {
      return smtpUsername;
    }
    return "no-reply@formweaver.local";
  }

  private String normalizeEmailLike(String value) {
    if (value == null) {
      return "";
    }
    String trimmed = value.trim();
    if (trimmed.isBlank()) {
      return "";
    }
    if (trimmed.contains("<") && trimmed.contains(">")) {
      int start = trimmed.indexOf('<');
      int end = trimmed.lastIndexOf('>');
      if (start >= 0 && end > start) {
        trimmed = trimmed.substring(start + 1, end).trim();
      }
    }
    return trimmed.contains("@") ? trimmed : "";
  }

  private String resolveBrevoApiKey(String configuredApiKey, String smtpPassword) {
    String fromEnv = configuredApiKey == null ? "" : configuredApiKey.trim();
    if (fromEnv.startsWith("api-key=")) {
      fromEnv = fromEnv.substring("api-key=".length()).trim();
    }
    if (!fromEnv.isBlank()) {
      return fromEnv;
    }

    String fromSmtpPassword = smtpPassword == null ? "" : smtpPassword.trim();
    if (fromSmtpPassword.startsWith("xkeysib-")) {
      return fromSmtpPassword;
    }
    return "";
  }

  private void sendWithBrevoApi(String recipientEmail, String subject, String htmlBody)
    throws IOException, InterruptedException {
    String from = resolveFromEmail();
    String senderName = "FormFlow AI";
    String recipient = recipientEmail == null ? "" : recipientEmail.trim();
    String payload = """
      {
        "sender": {"name":"%s","email":"%s"},
        "to":[{"email":"%s"}],
        "subject":"%s",
        "htmlContent":"%s"
      }
      """.formatted(
      escapeJson(senderName),
      escapeJson(from),
      escapeJson(recipient),
      escapeJson(subject),
      escapeJson(htmlBody)
    );

    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(BREVO_API_URL))
      .timeout(Duration.ofSeconds(10))
      .header("accept", "application/json")
      .header("content-type", "application/json")
      .header("api-key", brevoApiKey)
      .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
      .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    int status = response.statusCode();
    if (status < 200 || status >= 300) {
      String body = response.body() == null ? "" : response.body().trim();
      if (body.length() > 800) {
        body = body.substring(0, 800);
      }
      throw new IllegalStateException("Brevo API returned status " + status + " body: " + body);
    }
  }

  private String escapeJson(String value) {
    if (value == null) {
      return "";
    }
    StringBuilder sb = new StringBuilder(value.length() + 16);
    for (int i = 0; i < value.length(); i++) {
      char c = value.charAt(i);
      switch (c) {
        case '"':
          sb.append("\\\"");
          break;
        case '\\':
          sb.append("\\\\");
          break;
        case '\b':
          sb.append("\\b");
          break;
        case '\f':
          sb.append("\\f");
          break;
        case '\n':
          sb.append("\\n");
          break;
        case '\r':
          sb.append("\\r");
          break;
        case '\t':
          sb.append("\\t");
          break;
        default:
          if (c < 0x20) {
            sb.append(String.format("\\u%04x", (int) c));
          } else {
            sb.append(c);
          }
      }
    }
    return sb.toString();
  }

  private void sendHtmlEmailWithFrom(String from, String recipientEmail, String subject, String htmlBody)
    throws MessagingException, MailException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
    helper.setTo(recipientEmail);
    helper.setFrom(from);
    helper.setSubject(subject);
    helper.setText(htmlBody, true);
    mailSender.send(message);
  }
}
