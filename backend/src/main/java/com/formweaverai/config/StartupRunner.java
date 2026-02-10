package com.formweaverai.config;

import com.formweaverai.service.FormService;
import com.formweaverai.service.AuthService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupRunner implements ApplicationRunner {
  private final FormService formService;
  private final AuthService authService;

  public StartupRunner(FormService formService, AuthService authService) {
    this.formService = formService;
    this.authService = authService;
  }

  @Override
  public void run(ApplicationArguments args) {
    formService.seedTemplatesIfEmpty();
    authService.ensureDemoUser();
  }
}
