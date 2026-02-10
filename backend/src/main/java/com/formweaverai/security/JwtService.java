package com.formweaverai.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
  private static final String DEFAULT_SECRET = "change-me-in-env-please-change-this-secret";

  private Key getSigningKey() {
    String secret = System.getenv().getOrDefault("JWT_SECRET", DEFAULT_SECRET);
    if (secret.length() < 32) {
      secret = (secret + "-0123456789abcdef0123456789abcdef");
    }
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String generateToken(Long userId, String email) {
    Instant now = Instant.now();
    return Jwts.builder()
      .setSubject(String.valueOf(userId))
      .setIssuedAt(Date.from(now))
      .setExpiration(Date.from(now.plusSeconds(60 * 60 * 24 * 7)))
      .claim("email", email)
      .signWith(getSigningKey(), SignatureAlgorithm.HS256)
      .compact();
  }

  public Long parseUserId(String token) {
    String subject = Jwts.parser()
      .setSigningKey(getSigningKey())
      .build()
      .parseClaimsJws(token)
      .getBody()
      .getSubject();
    return Long.parseLong(subject);
  }
}
