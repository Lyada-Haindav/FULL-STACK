package com.formweaverai.service;

import com.formweaverai.model.Submission;
import com.formweaverai.model.Form;
import com.formweaverai.repository.FormRepository;
import com.formweaverai.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private FormRepository formRepository;

    public long getTotalSubmissionsCount(String userId) {
        List<String> formIds = getUserFormIds(userId);
        if (formIds.isEmpty()) {
            return 0L;
        }
        return submissionRepository.countByFormIdIn(formIds);
    }

    public long getTotalFormsCount(String userId) {
        if (userId == null || userId.isBlank()) {
            return 0L;
        }
        return formRepository.countByUserId(userId);
    }

    public long getPublishedFormsCount(String userId) {
        if (userId == null || userId.isBlank()) {
            return 0L;
        }
        return formRepository.countByUserIdAndIsPublishedTrue(userId);
    }

    public long getRecentSubmissionsCount(String userId) {
        List<String> formIds = getUserFormIds(userId);
        if (formIds.isEmpty()) {
            return 0L;
        }
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        return submissionRepository.countByFormIdInAndSubmittedAtAfter(formIds, thirtyDaysAgo);
    }

    public long getSubmissionsCountForForm(String formId) {
        return submissionRepository.countByFormId(formId);
    }

    public List<Submission> getSubmissionsForForm(String formId) {
        return submissionRepository.findAllByFormIdOrderBySubmittedAtDesc(formId);
    }

    public Map<String, Object> getAnalyticsSummary(String userId) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSubmissions", getTotalSubmissionsCount(userId));
        summary.put("totalForms", getTotalFormsCount(userId));
        summary.put("publishedForms", getPublishedFormsCount(userId));
        summary.put("recentSubmissions", getRecentSubmissionsCount(userId));
        return summary;
    }

    private List<String> getUserFormIds(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        return formRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
            .stream()
            .map(Form::getId)
            .toList();
    }
}
