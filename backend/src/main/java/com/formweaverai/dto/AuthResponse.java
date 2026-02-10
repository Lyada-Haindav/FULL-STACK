package com.formweaverai.dto;

public record AuthResponse(
  String token,
  UserDto user
) {}
