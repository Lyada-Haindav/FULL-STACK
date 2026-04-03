package com.formweaverai.controller;

import com.formweaverai.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private SubmissionService submissionService;

    @GetMapping("/total-submissions")
    public ResponseEntity<Map<String, Long>> getTotalSubmissions(Authentication authentication) {
        try {
            long totalSubmissions = submissionService.getTotalSubmissionsCount(getUserId(authentication));
            Map<String, Long> response = new HashMap<>();
            response.put("total", totalSubmissions);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return 0 if there's any error
            Map<String, Long> response = new HashMap<>();
            response.put("total", 0L);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary(Authentication authentication) {
        try {
            return ResponseEntity.ok(submissionService.getAnalyticsSummary(getUserId(authentication)));
        } catch (Exception e) {
            // Return zeros if there's any error
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalSubmissions", 0L);
            summary.put("totalForms", 0L);
            summary.put("publishedForms", 0L);
            summary.put("recentSubmissions", 0L);
            return ResponseEntity.ok(summary);
        }
    }

    private String getUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return "";
        }
        return authentication.getName();
    }
}
