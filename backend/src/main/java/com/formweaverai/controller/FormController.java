package com.formweaverai.controller;

import com.formweaverai.dto.*;
import com.formweaverai.service.FormService;
import com.formweaverai.model.FormFile;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FormController {
  private final FormService formService;
  private final ObjectMapper objectMapper;

  public FormController(FormService formService, ObjectMapper objectMapper) {
    this.formService = formService;
    this.objectMapper = objectMapper;
  }

  @GetMapping("/forms")
  public List<FormDto> listForms(Authentication authentication) {
    return formService.listForms(getUserId(authentication));
  }

  @GetMapping("/forms/{id}")
  public ResponseEntity<FormWithStepsDto> getForm(@PathVariable String id) {
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
  public ResponseEntity<FormDto> updateForm(@PathVariable String id, @RequestBody UpdateFormRequest request) {
    return formService.updateForm(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/forms/{id}")
  public ResponseEntity<Void> deleteForm(Authentication authentication, @PathVariable String id) {
    if (authentication == null || authentication.getName() == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    boolean deleted = formService.deleteForm(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{id}/delete")
  public ResponseEntity<Void> deleteFormPost(@PathVariable String id) {
    boolean deleted = formService.deleteForm(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{id}/publish")
  public ResponseEntity<FormDto> publishForm(@PathVariable String id) {
    return formService.publishForm(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/forms/{id}/clone")
  public ResponseEntity<FormDto> cloneForm(@PathVariable String id) {
    return formService.cloneForm(id)
      .map(form -> ResponseEntity.status(HttpStatus.CREATED).body(form))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping("/forms/{formId}/steps")
  public ResponseEntity<StepDto> createStep(@PathVariable String formId, @Valid @RequestBody CreateStepRequest request) {
    return formService.createStep(formId, request)
      .map(step -> ResponseEntity.status(HttpStatus.CREATED).body(step))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PutMapping("/steps/{id}")
  public ResponseEntity<StepDto> updateStep(@PathVariable String id, @RequestBody UpdateStepRequest request) {
    return formService.updateStep(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/steps/{id}")
  public ResponseEntity<Void> deleteStep(@PathVariable String id) {
    boolean deleted = formService.deleteStep(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/forms/{formId}/steps/reorder")
  public ResponseEntity<Void> reorderSteps(@PathVariable String formId, @RequestBody ReorderStepsRequest request) {
    if (request == null || request.steps() == null) {
      return ResponseEntity.badRequest().build();
    }
    request.steps().forEach(item -> formService.updateStep(item.id(), new UpdateStepRequest(null, null, item.orderIndex())));
    return ResponseEntity.ok().build();
  }

  @PostMapping("/steps/{stepId}/fields")
  public ResponseEntity<FieldDto> createField(@PathVariable String stepId, @Valid @RequestBody CreateFieldRequest request) {
    return formService.createField(stepId, request)
      .map(field -> ResponseEntity.status(HttpStatus.CREATED).body(field))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PutMapping("/fields/{id}")
  public ResponseEntity<FieldDto> updateField(@PathVariable String id, @RequestBody UpdateFieldRequest request) {
    return formService.updateField(id, request)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @DeleteMapping("/fields/{id}")
  public ResponseEntity<Void> deleteField(@PathVariable String id) {
    boolean deleted = formService.deleteField(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
  }

  @PostMapping("/steps/{stepId}/fields/reorder")
  public ResponseEntity<Void> reorderFields(@PathVariable String stepId, @RequestBody ReorderFieldsRequest request) {
    if (request == null || request.fields() == null) {
      return ResponseEntity.badRequest().build();
    }
    request.fields().forEach(item -> formService.updateField(item.id(), new UpdateFieldRequest(null, null, null, null, null, item.orderIndex(), null, null)));
    return ResponseEntity.ok().build();
  }

  @PostMapping(value = "/forms/{formId}/submissions", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<SubmissionDto> createSubmission(@PathVariable String formId, @RequestBody SubmitFormRequest request) {
    return formService.createSubmission(formId, request)
      .map(submission -> ResponseEntity.status(HttpStatus.CREATED).body(submission))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @PostMapping(value = "/forms/{formId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<SubmissionDto> createSubmissionMultipart(
    @PathVariable String formId,
    @RequestPart("data") String data,
    @RequestParam MultiValueMap<String, MultipartFile> files
  ) {
    try {
      JsonNode jsonData = objectMapper.readTree(data);
      return formService.createSubmissionWithFiles(formId, jsonData, files)
        .map(submission -> ResponseEntity.status(HttpStatus.CREATED).body(submission))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @GetMapping("/forms/{formId}/submissions")
  public ResponseEntity<List<SubmissionDto>> listSubmissions(@PathVariable String formId) {
    return formService.listSubmissions(formId)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  @GetMapping("/forms/{formId}/submissions/export")
  public ResponseEntity<byte[]> exportSubmissions(@PathVariable String formId) {
    var exportOpt = formService.buildSubmissionExport(formId);
    if (exportOpt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
    try {
      var export = exportOpt.get();
      byte[] zip = buildZip(export);
      String filename = "form_" + export.form().getId() + "_submissions.zip";
      return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(zip);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
  }

  private byte[] buildZip(FormService.SubmissionExport export) throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ZipOutputStream zos = new ZipOutputStream(baos);

    // CSV
    ZipEntry csvEntry = new ZipEntry("submissions.csv");
    zos.putNextEntry(csvEntry);
    zos.write(export.csv().getBytes());
    zos.closeEntry();

    // Files
    Set<String> usedNames = new HashSet<>();
    for (FormFile file : export.files()) {
      String baseName = file.getFilename() == null ? "file" : file.getFilename();
      String safeName = sanitizeName(baseName);
      String entryName = "files/" + file.getSubmissionId() + "/" + safeName;
      entryName = dedupeEntryName(usedNames, entryName);
      ZipEntry entry = new ZipEntry(entryName);
      zos.putNextEntry(entry);
      zos.write(file.getData());
      zos.closeEntry();
    }

    zos.finish();
    zos.close();
    return baos.toByteArray();
  }

  private String sanitizeName(String name) {
    return name.replace("\\", "_").replace("/", "_");
  }

  private String dedupeEntryName(Set<String> used, String entryName) {
    if (used.add(entryName)) {
      return entryName;
    }
    int i = 2;
    while (true) {
      String candidate = entryName + "_" + i;
      if (used.add(candidate)) {
        return candidate;
      }
      i++;
    }
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
