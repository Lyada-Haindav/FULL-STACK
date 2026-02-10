package com.formweaverai.controller;

import com.formweaverai.dto.*;
import com.formweaverai.service.FormService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FormController {
  private final FormService formService;

  public FormController(FormService formService) {
    this.formService = formService;
  }

  @GetMapping("/forms")
  public List<FormDto> listForms(Authentication authentication) {
    return formService.listForms(getUserId(authentication));
  }

  @GetMapping("/forms/{id}")
  public ResponseEntity<FormWithStepsDto> getForm(@PathVariable Long id) {
    return formService.getFormWithSteps(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/forms")
  public ResponseEntity<FormDto> createForm(Authentication authentication, @Valid @RequestBody CreateFormRequest request) {
    FormDto created = formService.createForm(getUserId(authentication), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PutMapping("/forms/{id}")
  public ResponseEntity<FormDto> updateForm(@PathVariable Long id, @RequestBody UpdateFormRequest request) {
    return formService.updateForm(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/forms/{id}")
  public ResponseEntity<Void> deleteForm(Authentication authentication, @PathVariable Long id) {
    if (authentication == null || authentication.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    boolean deleted = formService.deleteForm(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{id}/delete")
  public ResponseEntity<Void> deleteFormPost(@PathVariable Long id) {
    boolean deleted = formService.deleteForm(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{id}/publish")
  public ResponseEntity<FormDto> publishForm(@PathVariable Long id) {
    return formService.publishForm(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/forms/{formId}/steps")
  public ResponseEntity<StepDto> createStep(@PathVariable Long formId, @Valid @RequestBody CreateStepRequest request) {
    return formService.createStep(formId, request)
      .map(step -> ResponseEntity.status(HttpStatus.CREATED).body(step))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PutMapping("/steps/{id}")
  public ResponseEntity<StepDto> updateStep(@PathVariable Long id, @RequestBody UpdateStepRequest request) {
    return formService.updateStep(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/steps/{id}")
  public ResponseEntity<Void> deleteStep(@PathVariable Long id) {
    boolean deleted = formService.deleteStep(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{formId}/steps/reorder")
  public ResponseEntity<Void> reorderSteps(@PathVariable Long formId, @RequestBody ReorderStepsRequest request) {
    if (request == null || request.steps() == null) {
      return ResponseEntity.badRequest().build();
    }
    request.steps().forEach(item -> formService.updateStep(item.id(), new UpdateStepRequest(null, null, item.orderIndex())));
    return ResponseEntity.ok().build();
  }

  @PostMapping("/steps/{stepId}/fields")
  public ResponseEntity<FieldDto> createField(@PathVariable Long stepId, @Valid @RequestBody CreateFieldRequest request) {
    return formService.createField(stepId, request)
      .map(field -> ResponseEntity.status(HttpStatus.CREATED).body(field))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PutMapping("/fields/{id}")
  public ResponseEntity<FieldDto> updateField(@PathVariable Long id, @RequestBody UpdateFieldRequest request) {
    return formService.updateField(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/fields/{id}")
  public ResponseEntity<Void> deleteField(@PathVariable Long id) {
    boolean deleted = formService.deleteField(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/steps/{stepId}/fields/reorder")
  public ResponseEntity<Void> reorderFields(@PathVariable Long stepId, @RequestBody ReorderFieldsRequest request) {
    if (request == null || request.fields() == null) {
      return ResponseEntity.badRequest().build();
    }
    request.fields().forEach(item -> formService.updateField(item.id(), new UpdateFieldRequest(null, null, null, null, null, item.orderIndex(), null, null)));
    return ResponseEntity.ok().build();
  }

  @PostMapping("/forms/{formId}/submissions")
  public ResponseEntity<SubmissionDto> createSubmission(@PathVariable Long formId, @RequestBody SubmitFormRequest request) {
    return formService.createSubmission(formId, request)
      .map(submission -> ResponseEntity.status(HttpStatus.CREATED).body(submission))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @GetMapping("/forms/{formId}/submissions")
  public ResponseEntity<List<SubmissionDto>> listSubmissions(@PathVariable Long formId) {
    return formService.listSubmissions(formId)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/forms/create-complete")
  public ResponseEntity<FormWithStepsDto> createCompleteForm(Authentication authentication, @RequestBody CreateCompleteFormRequest request) {
    return formService.createCompleteForm(getUserId(authentication), request)
      .map(form -> ResponseEntity.status(HttpStatus.CREATED).body(form))
      .orElseGet(() -> ResponseEntity.badRequest().build());
  }

  private String getUserId(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      return "0";
    }
    return authentication.getName();
  }
}
