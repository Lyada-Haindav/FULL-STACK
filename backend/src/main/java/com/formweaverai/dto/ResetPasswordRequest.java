package com.formweaverai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
  @NotBlank String token,
  @NotBlank @Size(min = 6, max = 200) String password
) {}
