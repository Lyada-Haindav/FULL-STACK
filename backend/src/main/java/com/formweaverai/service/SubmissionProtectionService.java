package com.formweaverai.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SubmissionProtectionService {
  private static final Duration WINDOW = Duration.ofMinutes(10);
  private static final int MAX_SUBMISSIONS_PER_WINDOW = 8;

  private final Map<String, Deque<Long>> submissionTimesByKey = new ConcurrentHashMap<>();

  public void assertAllowed(String formId, HttpServletRequest request, String honeypotValue) {
    if (StringUtils.hasText(honeypotValue)) {
      throw new IllegalArgumentException("Submission rejected.");
    }

    String ip = resolveClientIp(request);
    String key = formId + "::" + ip;
    long now = System.currentTimeMillis();
    long cutoff = now - WINDOW.toMillis();

    Deque<Long> timestamps = submissionTimesByKey.computeIfAbsent(key, ignored -> new ArrayDeque<>());
    synchronized (timestamps) {
      while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
        timestamps.pollFirst();
      }
      if (timestamps.size() >= MAX_SUBMISSIONS_PER_WINDOW) {
        throw new RateLimitException("Too many submissions from this network. Please wait a few minutes and try again.");
      }
      timestamps.addLast(now);
    }
  }

  private String resolveClientIp(HttpServletRequest request) {
    if (request == null) {
      return "unknown";
    }
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (StringUtils.hasText(forwardedFor)) {
      return forwardedFor.split(",")[0].trim();
    }
    String realIp = request.getHeader("X-Real-IP");
    if (StringUtils.hasText(realIp)) {
      return realIp.trim();
    }
    return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr().trim();
  }

  public static class RateLimitException extends RuntimeException {
    public RateLimitException(String message) {
      super(message);
    }
  }
}
