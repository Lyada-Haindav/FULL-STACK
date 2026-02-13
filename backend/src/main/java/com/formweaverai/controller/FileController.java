package com.formweaverai.controller;

import com.formweaverai.model.FormFile;
import com.formweaverai.repository.FormFileRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
public class FileController {
  private final FormFileRepository fileRepository;

  public FileController(FormFileRepository fileRepository) {
    this.fileRepository = fileRepository;
  }

  @GetMapping("/files/{id}")
  public ResponseEntity<byte[]> download(@PathVariable String id, @RequestParam(name = "inline", required = false) String inline) {
    return fileRepository.findById(id)
      .map(file -> ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, buildContentDisposition(file, inline))
        .contentType(resolveContentType(file))
        .body(file.getData()))
      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
  }

  private String buildContentDisposition(FormFile file, String inline) {
    String filename = file.getFilename() == null ? "download" : file.getFilename().replace("\"", "'");
    String mode = "1".equals(inline) ? "inline" : "attachment";
    return mode + "; filename=\"" + filename + "\"";
  }

  private MediaType resolveContentType(FormFile file) {
    if (file.getContentType() == null || file.getContentType().isBlank()) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
    try {
      return MediaType.parseMediaType(file.getContentType());
    } catch (Exception e) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
  }
}
