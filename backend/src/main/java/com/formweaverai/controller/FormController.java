package com.formweaverai.controller;

import com.formweaverai.dto.*;
import com.formweaverai.service.FormService;
import com.formweaverai.service.SubmissionProtectionService;
import com.formweaverai.model.FormFile;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api")
public class FormController {
  private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Kolkata");
  private static final DateTimeFormatter SUBMISSION_TIME_FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'IST'").withZone(DISPLAY_ZONE);
  private final FormService formService;
  private final ObjectMapper objectMapper;
  private final SubmissionProtectionService submissionProtectionService;

  public FormController(FormService formService, ObjectMapper objectMapper, SubmissionProtectionService submissionProtectionService) {
    this.formService = formService;
    this.objectMapper = objectMapper;
    this.submissionProtectionService = submissionProtectionService;
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
  public ResponseEntity<SubmissionDto> createSubmission(@PathVariable String formId, @RequestBody SubmitFormRequest request, HttpServletRequest servletRequest) {
    try {
      submissionProtectionService.assertAllowed(formId, servletRequest, request.website());
      return formService.createSubmission(formId, request)
        .map(submission -> ResponseEntity.status(HttpStatus.CREATED).body(submission))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    } catch (SubmissionProtectionService.RateLimitException e) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
  }

  @PostMapping(value = "/forms/{formId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<SubmissionDto> createSubmissionMultipart(
    @PathVariable String formId,
    @RequestPart("data") String data,
    @RequestParam MultiValueMap<String, MultipartFile> files,
    @RequestParam(name = "website", required = false) String website,
    HttpServletRequest servletRequest
  ) {
    try {
      submissionProtectionService.assertAllowed(formId, servletRequest, website);
      JsonNode jsonData = objectMapper.readTree(data);
      return formService.createSubmissionWithFiles(formId, jsonData, files)
        .map(submission -> ResponseEntity.status(HttpStatus.CREATED).body(submission))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    } catch (SubmissionProtectionService.RateLimitException e) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
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
  public ResponseEntity<byte[]> exportSubmissions(@PathVariable String formId, HttpServletRequest request) {
    var exportOpt = formService.buildSubmissionExport(formId);
    var formOpt = formService.getFormWithSteps(formId);
    if (exportOpt.isEmpty() || formOpt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
    try {
      var export = exportOpt.get();
      byte[] workbook = buildWorkbook(export, formOpt.get(), buildBaseUrl(request));
      byte[] zip = buildZip(export, workbook);
      String filename = "form_" + export.form().getId() + "_submissions.zip";
      return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(zip);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
  }

  @GetMapping("/forms/{formId}/submissions/export.xlsx")
  public ResponseEntity<byte[]> exportSubmissionsWorkbook(@PathVariable String formId, HttpServletRequest request) {
    var exportOpt = formService.buildSubmissionExport(formId);
    var formOpt = formService.getFormWithSteps(formId);
    if (exportOpt.isEmpty() || formOpt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
    try {
      var export = exportOpt.get();
      byte[] workbook = buildWorkbook(export, formOpt.get(), buildBaseUrl(request));
      String filename = "form_" + export.form().getId() + "_submissions.xlsx";
      return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(workbook);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
  }

  private byte[] buildZip(FormService.SubmissionExport export, byte[] workbook) throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ZipOutputStream zos = new ZipOutputStream(baos);

    // CSV
    ZipEntry csvEntry = new ZipEntry("submissions.csv");
    zos.putNextEntry(csvEntry);
    zos.write(export.csv().getBytes());
    zos.closeEntry();

    ZipEntry workbookEntry = new ZipEntry("submissions.xlsx");
    zos.putNextEntry(workbookEntry);
    zos.write(workbook);
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

  private byte[] buildWorkbook(FormService.SubmissionExport export, FormWithStepsDto form, String baseUrl) throws Exception {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      CreationHelper creationHelper = workbook.getCreationHelper();
      CellStyle headerStyle = createHeaderStyle(workbook);
      CellStyle dateStyle = createDateStyle(workbook, creationHelper);
      CellStyle linkStyle = createLinkStyle(workbook);
      LinkedHashMap<String, String> orderedFields = buildOrderedFieldLabels(form, export.submissions());

      writeSubmissionsSheet(workbook.createSheet("Submissions"), export.submissions(), orderedFields, headerStyle, dateStyle);
      writeFilesSheet(workbook.createSheet("Files"), export, orderedFields, baseUrl, creationHelper, headerStyle, dateStyle, linkStyle);

      workbook.write(baos);
      return baos.toByteArray();
    }
  }

  private void writeSubmissionsSheet(
    Sheet sheet,
    List<com.formweaverai.model.Submission> submissions,
    LinkedHashMap<String, String> orderedFields,
    CellStyle headerStyle,
    CellStyle dateStyle
  ) {
    Row header = sheet.createRow(0);
    writeCell(header, 0, "Submitted At", headerStyle);

    int headerColumn = 1;
    for (String label : orderedFields.values()) {
      writeCell(header, headerColumn++, label, headerStyle);
    }

    int rowIndex = 1;
    for (com.formweaverai.model.Submission submission : submissions) {
      Row row = sheet.createRow(rowIndex++);
      writeInstantCell(row, 0, submission.getSubmittedAt(), dateStyle);
      Map<String, Object> values = castSubmissionData(submission.getData());

      int columnIndex = 1;
      for (String key : orderedFields.keySet()) {
        writeCell(row, columnIndex++, renderWorkbookValue(values.get(key)), null);
      }
    }

    sheet.createFreezePane(0, 1);
    autoSizeColumns(sheet, orderedFields.size() + 1);
  }

  private void writeFilesSheet(
    Sheet sheet,
    FormService.SubmissionExport export,
    LinkedHashMap<String, String> orderedFields,
    String baseUrl,
    CreationHelper creationHelper,
    CellStyle headerStyle,
    CellStyle dateStyle,
    CellStyle linkStyle
  ) {
    Row header = sheet.createRow(0);
    String[] headers = {
      "Submitted At",
      "Submission ID",
      "Field",
      "File Name",
      "Content Type",
      "Size (KB)",
      "Download URL",
      "View URL"
    };
    for (int i = 0; i < headers.length; i++) {
      writeCell(header, i, headers[i], headerStyle);
    }

    Map<String, Instant> submittedAtBySubmission = new HashMap<>();
    for (com.formweaverai.model.Submission submission : export.submissions()) {
      submittedAtBySubmission.put(submission.getId(), submission.getSubmittedAt());
    }

    int rowIndex = 1;
    for (FormFile file : export.files()) {
      Row row = sheet.createRow(rowIndex++);
      writeInstantCell(row, 0, submittedAtBySubmission.get(file.getSubmissionId()), dateStyle);
      writeCell(row, 1, file.getSubmissionId(), null);
      writeCell(row, 2, orderedFields.getOrDefault(file.getFieldId(), file.getFieldId()), null);
      writeCell(row, 3, file.getFilename(), null);
      writeCell(row, 4, file.getContentType(), null);
      writeNumericCell(row, 5, file.getSize() > 0 ? Math.round((file.getSize() / 1024.0) * 100.0) / 100.0 : 0);

      String downloadUrl = baseUrl + "/api/files/" + file.getId();
      String viewUrl = downloadUrl + "?inline=1";
      writeLinkCell(row, 6, downloadUrl, creationHelper, linkStyle);
      writeLinkCell(row, 7, viewUrl, creationHelper, linkStyle);
    }

    sheet.createFreezePane(0, 1);
    autoSizeColumns(sheet, headers.length);
  }

  private LinkedHashMap<String, String> buildOrderedFieldLabels(FormWithStepsDto form, List<com.formweaverai.model.Submission> submissions) {
    LinkedHashMap<String, String> orderedFields = new LinkedHashMap<>();

    List<StepDto> steps = new ArrayList<>();
    if (form.steps() != null) {
      steps.addAll(form.steps());
    }
    steps.sort(Comparator.comparing(step -> step.orderIndex() == null ? 0 : step.orderIndex()));

    for (StepDto step : steps) {
      List<FieldDto> fields = new ArrayList<>();
      if (step.fields() != null) {
        fields.addAll(step.fields());
      }
      fields.sort(Comparator.comparing(field -> field.orderIndex() == null ? 0 : field.orderIndex()));
      for (FieldDto field : fields) {
        String key = "field_" + field.id();
        String label = field.label() == null || field.label().isBlank() ? key : field.label();
        orderedFields.put(key, label);
      }
    }

    for (com.formweaverai.model.Submission submission : submissions) {
      Map<String, Object> values = castSubmissionData(submission.getData());
      for (String key : values.keySet()) {
        orderedFields.putIfAbsent(key, key);
      }
    }

    return orderedFields;
  }

  private Map<String, Object> castSubmissionData(Object rawData) {
    if (!(rawData instanceof Map<?, ?> map)) {
      return Map.of();
    }

    Map<String, Object> normalized = new HashMap<>();
    for (Map.Entry<?, ?> entry : map.entrySet()) {
      if (entry.getKey() != null) {
        normalized.put(String.valueOf(entry.getKey()), entry.getValue());
      }
    }
    return normalized;
  }

  private String renderWorkbookValue(Object value) {
    if (value == null) {
      return "";
    }
    if (value instanceof Map<?, ?> map) {
      if ("file".equals(map.get("type")) && map.get("files") instanceof List<?> files) {
        List<String> names = new ArrayList<>();
        for (Object item : files) {
          if (item instanceof Map<?, ?> fileMeta && fileMeta.get("name") != null) {
            names.add(String.valueOf(fileMeta.get("name")));
          }
        }
        return String.join("; ", names);
      }
      return String.valueOf(map);
    }
    if (value instanceof List<?> list) {
      List<String> parts = new ArrayList<>();
      for (Object item : list) {
        parts.add(String.valueOf(item));
      }
      return String.join("; ", parts);
    }
    return String.valueOf(value);
  }

  private CellStyle createHeaderStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setAlignment(HorizontalAlignment.CENTER);

    Font font = workbook.createFont();
    font.setBold(true);
    style.setFont(font);
    return style;
  }

  private CellStyle createDateStyle(Workbook workbook, CreationHelper creationHelper) {
    CellStyle style = workbook.createCellStyle();
    style.setDataFormat(creationHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm:ss"));
    return style;
  }

  private CellStyle createLinkStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    Font font = workbook.createFont();
    font.setUnderline(Font.U_SINGLE);
    font.setColor(IndexedColors.BLUE.getIndex());
    style.setFont(font);
    return style;
  }

  private void writeCell(Row row, int columnIndex, String value, CellStyle style) {
    Cell cell = row.createCell(columnIndex);
    cell.setCellValue(value == null ? "" : value);
    if (style != null) {
      cell.setCellStyle(style);
    }
  }

  private void writeNumericCell(Row row, int columnIndex, double value) {
    row.createCell(columnIndex).setCellValue(value);
  }

  private void writeInstantCell(Row row, int columnIndex, Instant instant, CellStyle style) {
    Cell cell = row.createCell(columnIndex);
    if (instant == null) {
      cell.setCellValue("");
      return;
    }
    cell.setCellValue(formatSubmissionInstant(instant));
  }

  private String formatSubmissionInstant(Instant instant) {
    return instant == null ? "" : SUBMISSION_TIME_FORMATTER.format(instant);
  }

  private void writeLinkCell(Row row, int columnIndex, String url, CreationHelper creationHelper, CellStyle linkStyle) {
    Cell cell = row.createCell(columnIndex);
    cell.setCellValue(url);
    var hyperlink = creationHelper.createHyperlink(HyperlinkType.URL);
    hyperlink.setAddress(url);
    cell.setHyperlink(hyperlink);
    cell.setCellStyle(linkStyle);
  }

  private void autoSizeColumns(Sheet sheet, int columnCount) {
    for (int i = 0; i < columnCount; i++) {
      sheet.autoSizeColumn(i);
      int width = sheet.getColumnWidth(i);
      sheet.setColumnWidth(i, Math.min(width + 768, 18000));
    }
  }

  private String buildBaseUrl(HttpServletRequest request) {
    return ServletUriComponentsBuilder.fromRequestUri(request)
      .replacePath(request.getContextPath())
      .replaceQuery(null)
      .build()
      .toUriString();
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
