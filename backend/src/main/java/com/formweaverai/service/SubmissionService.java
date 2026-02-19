package com.formweaverai.service;

import com.formweaverai.model.Submission;
import com.formweaverai.repository.FormRepository;
import com.formweaverai.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private FormRepository formRepository;

    public long getTotalSubmissionsCount() {
        return submissionRepository.count();
    }

    public long getTotalFormsCount() {
        return formRepository.count();
    }

    public long getPublishedFormsCount() {
        return formRepository.countByIsPublishedTrue();
    }

    public long getRecentSubmissionsCount() {
        // Count submissions from the last 30 days
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        return submissionRepository.countBySubmittedAtAfter(thirtyDaysAgo);
    }

    public long getSubmissionsCountForForm(String formId) {
        return submissionRepository.countByFormId(formId);
    }

    public List<Submission> getSubmissionsForForm(String formId) {
        return submissionRepository.findAllByFormIdOrderBySubmittedAtDesc(formId);
    }
}
