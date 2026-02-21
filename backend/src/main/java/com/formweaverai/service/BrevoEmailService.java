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

@Service
public class BrevoEmailService {
  private static final Logger logger = LoggerFactory.getLogger(BrevoEmailService.class);

  private final JavaMailSender mailSender;
  private final TaskExecutor taskExecutor;
  private final String fromEmail;
  private final String smtpUsername;
  private final String appBaseUrl;

  public BrevoEmailService(
    JavaMailSender mailSender,
    @Qualifier("appTaskExecutor") TaskExecutor taskExecutor,
    @Value("${app.mail.from:no-reply@formweaver.local}") String fromEmail,
    @Value("${spring.mail.username:}") String smtpUsername,
    @Value("${app.base-url:http://localhost:8080}") String appBaseUrl
  ) {
    this.mailSender = mailSender;
    this.taskExecutor = taskExecutor;
    this.fromEmail = fromEmail;
    this.smtpUsername = smtpUsername == null ? "" : smtpUsername.trim();
    this.appBaseUrl = trimTrailingSlash(appBaseUrl);
    sanitizeBrevoPassword();
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

  private void sanitizeBrevoPassword() {
    if (!(mailSender instanceof JavaMailSenderImpl sender)) {
      return;
    }

    String password = sender.getPassword();
    if (password != null && password.startsWith("api-key=")) {
      sender.setPassword(password.substring("api-key=".length()));
    }
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
    String configured = fromEmail == null ? "" : fromEmail.trim();
    if (!configured.isBlank() && !configured.endsWith("@formweaver.local")) {
      return configured;
    }
    if (!smtpUsername.isBlank()) {
      return smtpUsername;
    }
    return "no-reply@formweaver.local";
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
