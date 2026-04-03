package com.formweaverai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.formweaverai.dto.*;
import com.formweaverai.model.*;
import com.formweaverai.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;

@Service
public class FormService {
  private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Kolkata");
  private static final DateTimeFormatter SUBMISSION_TIME_FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'IST'").withZone(DISPLAY_ZONE);
  private final FormRepository formRepository;
  private final FormStepRepository stepRepository;
  private final FormFieldRepository fieldRepository;
  private final SubmissionRepository submissionRepository;
  private final TemplateRepository templateRepository;
  private final FormFileRepository fileRepository;
  private final ObjectMapper objectMapper;

  public FormService(
    FormRepository formRepository,
    FormStepRepository stepRepository,
    FormFieldRepository fieldRepository,
    SubmissionRepository submissionRepository,
    TemplateRepository templateRepository,
    FormFileRepository fileRepository,
    ObjectMapper objectMapper
  ) {
    this.formRepository = formRepository;
    this.stepRepository = stepRepository;
    this.fieldRepository = fieldRepository;
    this.submissionRepository = submissionRepository;
    this.templateRepository = templateRepository;
    this.fileRepository = fileRepository;
    this.objectMapper = objectMapper;
  }

  public List<FormDto> listForms(String userId) {
    return formRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
      .stream()
      .map(this::toFormDto)
      .toList();
  }

  public Optional<FormWithStepsDto> getFormWithSteps(String id) {
    return formRepository.findById(id).map(this::toFormWithStepsDto);
  }

  @Transactional
  public FormDto createForm(String userId, CreateFormRequest request) {
    Form form = new Form();
    form.setUserId(userId);
    form.setTitle(request.title());
    form.setDescription(request.description());
    if (request.isPublished() != null) {
      form.setPublished(request.isPublished());
    }
    if (request.theme() != null) {
      form.setTheme(request.theme());
    }
    return toFormDto(formRepository.save(form));
  }

  @Transactional
  public Optional<FormDto> updateForm(String id, UpdateFormRequest request) {
    return formRepository.findById(id).map(form -> {
      if (request.title() != null) {
        form.setTitle(request.title());
      }
      if (request.description() != null) {
        form.setDescription(request.description());
      }
      if (request.isPublished() != null) {
        form.setPublished(request.isPublished());
      }
      if (request.theme() != null) {
        form.setTheme(request.theme());
      }
      return toFormDto(formRepository.save(form));
    });
  }

  @Transactional
  public boolean deleteForm(String id) {
    return formRepository.findById(id).map(form -> {
      List<FormStep> steps = stepRepository.findAllByFormIdOrderByOrderIndexAsc(form.getId());
      if (!steps.isEmpty()) {
        List<String> stepIds = steps.stream().map(FormStep::getId).toList();
        fieldRepository.deleteAllByStepIdIn(stepIds);
      }
      stepRepository.deleteAllByFormId(form.getId());
      fileRepository.deleteAllByFormId(form.getId());
      submissionRepository.deleteAllByFormId(form.getId());
      formRepository.delete(form);
      return true;
    }).orElse(false);
  }

  @Transactional
  public Optional<FormDto> publishForm(String id) {
    return formRepository.findById(id).map(form -> {
      form.setPublished(!form.isPublished());
      return toFormDto(formRepository.save(form));
    });
  }

  @Transactional
  public Optional<FormDto> cloneForm(String id) {
    return formRepository.findById(id).map(original -> {
      Form cloned = new Form();
      cloned.setUserId(original.getUserId());
      cloned.setTitle("Copy of " + original.getTitle());
      cloned.setDescription(original.getDescription());
      cloned.setPublished(false);
      cloned = formRepository.save(cloned);

      List<FormStep> steps = stepRepository.findAllByFormIdOrderByOrderIndexAsc(original.getId());
      Map<String, String> stepIdMap = new HashMap<>();
      for (FormStep step : steps) {
        FormStep newStep = new FormStep();
        newStep.setFormId(cloned.getId());
        newStep.setTitle(step.getTitle());
        newStep.setDescription(step.getDescription());
        newStep.setOrderIndex(step.getOrderIndex());
        newStep = stepRepository.save(newStep);
        stepIdMap.put(step.getId(), newStep.getId());
      }

      Map<String, List<FormField>> fieldsByStep = fieldsByStepId(steps);
      for (FormStep step : steps) {
        List<FormField> fields = fieldsByStep.getOrDefault(step.getId(), List.of());
        for (FormField field : fields) {
          FormField newField = new FormField();
          newField.setStepId(stepIdMap.get(step.getId()));
          newField.setType(field.getType());
          newField.setLabel(field.getLabel());
          newField.setPlaceholder(field.getPlaceholder());
          newField.setDefaultValue(field.getDefaultValue());
          newField.setRequired(field.isRequired());
          newField.setOrderIndex(field.getOrderIndex());
          newField.setOptions(field.getOptions());
          newField.setValidationRules(field.getValidationRules());
          fieldRepository.save(newField);
        }
      }

      return toFormDto(cloned);
    });
  }

  @Transactional
  public Optional<StepDto> createStep(String formId, CreateStepRequest request) {
    return formRepository.findById(formId).map(form -> {
      FormStep step = new FormStep();
      step.setFormId(form.getId());
      step.setTitle(request.title());
      step.setDescription(request.description());
      int orderIndex = (int) stepRepository.countByFormId(form.getId());
      step.setOrderIndex(orderIndex);
      return toStepDto(stepRepository.save(step), List.of());
    });
  }

  @Transactional
  public Optional<StepDto> updateStep(String stepId, UpdateStepRequest request) {
    return stepRepository.findById(stepId).map(step -> {
      if (request.title() != null) {
        step.setTitle(request.title());
      }
      if (request.description() != null) {
        step.setDescription(request.description());
      }
      if (request.orderIndex() != null) {
        step.setOrderIndex(request.orderIndex());
      }
      return toStepDto(stepRepository.save(step), List.of());
    });
  }

  @Transactional
  public boolean deleteStep(String stepId) {
    if (!stepRepository.existsById(stepId)) {
      return false;
    }
    fieldRepository.deleteAllByStepId(stepId);
    stepRepository.deleteById(stepId);
    return true;
  }

  @Transactional
  public Optional<FieldDto> createField(String stepId, CreateFieldRequest request) {
    return stepRepository.findById(stepId).map(step -> {
      FormField field = new FormField();
      field.setStepId(step.getId());
      field.setType(request.type());
      field.setLabel(request.label());
      field.setPlaceholder(request.placeholder());
      field.setDefaultValue(request.defaultValue());
      field.setRequired(request.required() != null && request.required());
      int orderIndex = (int) fieldRepository.countByStepId(step.getId());
      field.setOrderIndex(orderIndex);
      field.setOptions(normalizeToObject(request.options()));
      Object rules = normalizeToObject(request.validationRules());
      if ("file".equalsIgnoreCase(request.type()) && rules == null) {
        rules = defaultFileRules();
      }
      field.setValidationRules(rules);
      return toFieldDto(fieldRepository.save(field));
    });
  }

  @Transactional
  public Optional<FieldDto> updateField(String fieldId, UpdateFieldRequest request) {
    return fieldRepository.findById(fieldId).map(field -> {
      if (request.type() != null) {
        field.setType(request.type());
      }
      if (request.label() != null) {
        field.setLabel(request.label());
      }
      if (request.placeholder() != null) {
        field.setPlaceholder(request.placeholder());
      }
      if (request.defaultValue() != null) {
        field.setDefaultValue(request.defaultValue());
      }
      if (request.required() != null) {
        field.setRequired(request.required());
      }
      if (request.orderIndex() != null) {
        field.setOrderIndex(request.orderIndex());
      }
      if (request.options() != null) {
        field.setOptions(normalizeToObject(request.options()));
      }
      if (request.validationRules() != null) {
        field.setValidationRules(normalizeToObject(request.validationRules()));
      }
      if ("file".equalsIgnoreCase(field.getType()) && field.getValidationRules() == null) {
        field.setValidationRules(defaultFileRules());
      }
      return toFieldDto(fieldRepository.save(field));
    });
  }

  @Transactional
  public boolean deleteField(String fieldId) {
    if (!fieldRepository.existsById(fieldId)) {
      return false;
    }
    fieldRepository.deleteById(fieldId);
    return true;
  }

  @Transactional
  public Optional<SubmissionDto> createSubmission(String formId, SubmitFormRequest request) {
    return formRepository.findById(formId).map(form -> {
      Map<String, Object> dataMap = normalizeToMap(request.data());
      Submission submission = new Submission();
      submission.setFormId(form.getId());
      submission.setData(dataMap);
      return toSubmissionDto(submissionRepository.save(submission));
    });
  }

  @Transactional
  public Optional<SubmissionDto> createSubmissionWithFiles(String formId, JsonNode data, MultiValueMap<String, MultipartFile> files) {
    return formRepository.findById(formId).map(form -> {
      Map<String, Object> dataMap = normalizeToMap(data);
      Map<String, Map<String, Object>> fieldRules = loadFieldRules(form.getId());

      Submission submission = new Submission();
      submission.setFormId(form.getId());
      submission.setData(dataMap);
      submission = submissionRepository.save(submission);

      if (files != null) {
        for (Map.Entry<String, List<MultipartFile>> entry : files.entrySet()) {
          String key = entry.getKey();
          if (!key.startsWith("file_")) {
            continue;
          }
          String dataKey = key.substring("file_".length());
          validateFilesAgainstRules(dataKey, entry.getValue(), fieldRules);
          List<Map<String, Object>> fileArray = new ArrayList<>();

          for (MultipartFile file : entry.getValue()) {
            if (file == null || file.isEmpty()) {
              continue;
            }
            try {
              FormFile stored = new FormFile();
              stored.setFormId(form.getId());
              stored.setSubmissionId(submission.getId());
              stored.setFieldId(dataKey);
              stored.setFilename(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
              stored.setContentType(file.getContentType());
              stored.setSize(file.getSize());
              stored.setData(file.getBytes());
              stored = fileRepository.save(stored);

              Map<String, Object> meta = new HashMap<>();
              meta.put("id", stored.getId());
              meta.put("name", stored.getFilename());
              meta.put("contentType", stored.getContentType() == null ? "" : stored.getContentType());
              meta.put("size", stored.getSize());
              fileArray.add(meta);
            } catch (Exception e) {
              throw new RuntimeException("Failed to store uploaded file", e);
            }
          }

          if (!fileArray.isEmpty()) {
            Map<String, Object> fileValue = new HashMap<>();
            fileValue.put("type", "file");
            fileValue.put("files", fileArray);
            dataMap.put(dataKey, fileValue);
          }
        }
      }

      submission.setData(dataMap);
      submission = submissionRepository.save(submission);
      return toSubmissionDto(submission);
    });
  }

  public Optional<List<SubmissionDto>> listSubmissions(String formId) {
    return formRepository.findById(formId).map(form ->
      submissionRepository.findAllByFormIdOrderBySubmittedAtDesc(form.getId())
        .stream()
        .map(this::toSubmissionDto)
        .toList()
    );
  }

  public Optional<SubmissionExport> buildSubmissionExport(String formId) {
    return formRepository.findById(formId).map(form -> {
      List<Submission> submissions = submissionRepository.findAllByFormIdOrderBySubmittedAtDesc(form.getId());
      List<FormFile> files = fileRepository.findAllByFormId(form.getId());
      String csv = buildCsv(submissions);
      return new SubmissionExport(form, submissions, files, csv);
    });
  }

  @Transactional
  public Optional<FormWithStepsDto> createCompleteForm(String userId, CreateCompleteFormRequest request) {
    if (request.title() == null || request.steps() == null) {
      return Optional.empty();
    }

    Form form = new Form();
    form.setUserId(userId);
    form.setTitle(request.title());
    form.setDescription(request.description() == null ? "" : request.description());
    form.setPublished(false);
    form = formRepository.save(form);

    List<FormStep> savedSteps = new ArrayList<>();
    int stepIndex = 0;
    for (CreateCompleteFormRequest.StepInput stepInput : request.steps()) {
      FormStep step = new FormStep();
      step.setFormId(form.getId());
      step.setTitle(stepInput.title() == null ? "Untitled Step" : stepInput.title());
      step.setDescription(stepInput.description());
      step.setOrderIndex(stepIndex++);
      savedSteps.add(stepRepository.save(step));
    }

    int i = 0;
    for (CreateCompleteFormRequest.StepInput stepInput : request.steps()) {
      FormStep step = savedSteps.get(i++);
      if (stepInput.fields() == null) {
        continue;
      }
      int fieldIndex = 0;
      for (CreateCompleteFormRequest.FieldInput fieldInput : stepInput.fields()) {
        FormField field = new FormField();
        field.setStepId(step.getId());
        field.setType(fieldInput.type() == null ? "text" : fieldInput.type());
        field.setLabel(fieldInput.label() == null ? "Field" : fieldInput.label());
        field.setPlaceholder(fieldInput.placeholder());
        field.setDefaultValue(fieldInput.defaultValue());
        field.setRequired(fieldInput.required() != null && fieldInput.required());
        field.setOrderIndex(fieldIndex++);
        if (fieldInput.options() != null) {
          field.setOptions(fieldInput.options());
        }
        Object rules = fieldInput.validationRules();
        if ("file".equalsIgnoreCase(field.getType()) && rules == null) {
          rules = defaultFileRules();
        }
        field.setValidationRules(rules);
        fieldRepository.save(field);
      }
    }

    return Optional.of(toFormWithStepsDto(form));
  }

  public void seedTemplatesIfEmpty() {
    if (templateRepository.count() > 0) {
      return;
    }

    List<Template> templates = new ArrayList<>();
    templates.add(buildTemplate(
      "Contact Form",
      "Simple contact form for websites.",
      "Mail",
      "Business",
      "{\"title\":\"Contact Us\",\"description\":\"We would love to hear from you.\",\"steps\":[{\"title\":\"Your Details\",\"description\":\"Let us know who you are.\",\"fields\":[{\"type\":\"text\",\"label\":\"Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"textarea\",\"label\":\"Message\",\"required\":true,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Job Application",
      "Standard job application form.",
      "Briefcase",
      "HR",
      "{\"title\":\"Job Application\",\"description\":\"Apply for our open positions.\",\"steps\":[{\"title\":\"Personal Info\",\"description\":\"Basic information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Experience\",\"description\":\"Tell us about your work history.\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Resume / Cover Letter\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"LinkedIn Profile\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Event Registration",
      "Register attendees for an event.",
      "Calendar",
      "Events",
      "{\"title\":\"Event Registration\",\"description\":\"Join us for our upcoming event.\",\"steps\":[{\"title\":\"Attendee Info\",\"description\":\"Who is coming?\",\"fields\":[{\"type\":\"text\",\"label\":\"Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Ticket Type\",\"required\":true,\"orderIndex\":2,\"options\":[{\"label\":\"General Admission\",\"value\":\"general\"},{\"label\":\"VIP\",\"value\":\"vip\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Client Intake",
      "Collect onboarding details for a new client.",
      "ClipboardList",
      "Business",
      "{\"title\":\"Client Intake\",\"description\":\"Help us onboard you faster.\",\"steps\":[{\"title\":\"Company Details\",\"description\":\"Tell us about your business.\",\"fields\":[{\"type\":\"text\",\"label\":\"Company Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Website\",\"required\":false,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Company Size\",\"required\":true,\"orderIndex\":2,\"options\":[{\"label\":\"1-10\",\"value\":\"1-10\"},{\"label\":\"11-50\",\"value\":\"11-50\"},{\"label\":\"51-200\",\"value\":\"51-200\"},{\"label\":\"201+\",\"value\":\"201+\"}]}]},{\"title\":\"Project Goals\",\"description\":\"Define your goals and timeline.\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Primary Goals\",\"required\":true,\"orderIndex\":0},{\"type\":\"date\",\"label\":\"Target Launch Date\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Product Feedback",
      "Capture feature requests and usability feedback.",
      "MessageSquare",
      "Product",
      "{\"title\":\"Product Feedback\",\"description\":\"We value your thoughts on our product.\",\"steps\":[{\"title\":\"Experience\",\"description\":\"How was your experience?\",\"fields\":[{\"type\":\"select\",\"label\":\"Overall Satisfaction\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Excellent\",\"value\":\"excellent\"},{\"label\":\"Good\",\"value\":\"good\"},{\"label\":\"Fair\",\"value\":\"fair\"},{\"label\":\"Poor\",\"value\":\"poor\"}]},{\"type\":\"textarea\",\"label\":\"What did you like most?\",\"required\":false,\"orderIndex\":1}]},{\"title\":\"Improvements\",\"description\":\"What can we do better?\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Feature Requests\",\"required\":false,\"orderIndex\":0},{\"type\":\"checkbox\",\"label\":\"May we contact you for follow-up?\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Event Volunteer",
      "Organize volunteer availability and skills.",
      "Users",
      "Events",
      "{\"title\":\"Volunteer Sign‑Up\",\"description\":\"Join the event team.\",\"steps\":[{\"title\":\"Volunteer Details\",\"description\":\"Introduce yourself.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Preferred Role\",\"required\":true,\"orderIndex\":2,\"options\":[{\"label\":\"Registration\",\"value\":\"registration\"},{\"label\":\"Logistics\",\"value\":\"logistics\"},{\"label\":\"Guest Support\",\"value\":\"support\"}]}]},{\"title\":\"Availability\",\"description\":\"Let us know when you're free.\",\"fields\":[{\"type\":\"checkbox\",\"label\":\"Weekday Morning\",\"required\":false,\"orderIndex\":0},{\"type\":\"checkbox\",\"label\":\"Weekday Evening\",\"required\":false,\"orderIndex\":1},{\"type\":\"checkbox\",\"label\":\"Weekend\",\"required\":false,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Customer NPS",
      "Measure loyalty and collect improvement ideas.",
      "Star",
      "Customer Success",
      "{\"title\":\"Customer NPS Survey\",\"description\":\"Help us improve your experience.\",\"steps\":[{\"title\":\"NPS\",\"description\":\"Rate your experience.\",\"fields\":[{\"type\":\"number\",\"label\":\"How likely are you to recommend us? (0‑10)\",\"required\":true,\"orderIndex\":0},{\"type\":\"textarea\",\"label\":\"What influenced your score?\",\"required\":false,\"orderIndex\":1}]},{\"title\":\"Follow‑up\",\"description\":\"Tell us more.\",\"fields\":[{\"type\":\"select\",\"label\":\"Primary Use Case\",\"required\":false,\"orderIndex\":0,\"options\":[{\"label\":\"Internal Operations\",\"value\":\"ops\"},{\"label\":\"Customer Success\",\"value\":\"cs\"},{\"label\":\"Marketing\",\"value\":\"marketing\"}]},{\"type\":\"textarea\",\"label\":\"Anything else we should know?\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Blood Donation Intake",
      "Screen blood donors and schedule appointments.",
      "HeartPulse",
      "Healthcare",
      "{\"title\":\"Blood Donation Intake\",\"description\":\"Confirm eligibility and schedule a donation.\",\"steps\":[{\"title\":\"Eligibility\",\"description\":\"Quick eligibility checks.\",\"fields\":[{\"type\":\"number\",\"label\":\"Age\",\"required\":true,\"orderIndex\":0},{\"type\":\"number\",\"label\":\"Weight (kg)\",\"required\":true,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Donated in last 8 weeks?\",\"required\":true,\"orderIndex\":2,\"options\":[{\"label\":\"Yes\",\"value\":\"yes\"},{\"label\":\"No\",\"value\":\"no\"}]}]},{\"title\":\"Health History\",\"description\":\"Health background.\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Current medications\",\"required\":false,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Any recent vaccinations?\",\"required\":false,\"orderIndex\":1,\"options\":[{\"label\":\"No\",\"value\":\"no\"},{\"label\":\"Within 2 weeks\",\"value\":\"2w\"},{\"label\":\"More than 2 weeks ago\",\"value\":\"more_2w\"}]}]},{\"title\":\"Schedule\",\"description\":\"Choose a slot.\",\"fields\":[{\"type\":\"date\",\"label\":\"Preferred date\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Preferred time\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Morning\",\"value\":\"morning\"},{\"label\":\"Afternoon\",\"value\":\"afternoon\"},{\"label\":\"Evening\",\"value\":\"evening\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Medical Intake",
      "Collect patient details and symptoms.",
      "Stethoscope",
      "Healthcare",
      "{\"title\":\"Patient Intake\",\"description\":\"Provide medical history and appointment details.\",\"steps\":[{\"title\":\"Patient Details\",\"description\":\"Basic information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"date\",\"label\":\"Date of Birth\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2},{\"type\":\"text\",\"label\":\"Email\",\"required\":false,\"orderIndex\":3}]},{\"title\":\"Health History\",\"description\":\"Current symptoms.\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Reason for visit\",\"required\":true,\"orderIndex\":0},{\"type\":\"textarea\",\"label\":\"Current medications\",\"required\":false,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Allergies?\",\"required\":false,\"orderIndex\":2,\"options\":[{\"label\":\"No\",\"value\":\"no\"},{\"label\":\"Yes\",\"value\":\"yes\"}]}]},{\"title\":\"Appointment\",\"description\":\"Scheduling preferences.\",\"fields\":[{\"type\":\"date\",\"label\":\"Preferred date\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Preferred time\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Morning\",\"value\":\"morning\"},{\"label\":\"Afternoon\",\"value\":\"afternoon\"},{\"label\":\"Evening\",\"value\":\"evening\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Course Registration",
      "Enroll learners and capture goals.",
      "BookOpen",
      "Education",
      "{\"title\":\"Course Registration\",\"description\":\"Register for a training program.\",\"steps\":[{\"title\":\"Student Info\",\"description\":\"Tell us about you.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":false,\"orderIndex\":2}]},{\"title\":\"Program Details\",\"description\":\"Pick a track.\",\"fields\":[{\"type\":\"select\",\"label\":\"Track\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Beginner\",\"value\":\"beginner\"},{\"label\":\"Intermediate\",\"value\":\"intermediate\"},{\"label\":\"Advanced\",\"value\":\"advanced\"}]},{\"type\":\"select\",\"label\":\"Schedule\",\"required\":false,\"orderIndex\":1,\"options\":[{\"label\":\"Weekdays\",\"value\":\"weekdays\"},{\"label\":\"Weekends\",\"value\":\"weekends\"},{\"label\":\"Evenings\",\"value\":\"evenings\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Support Ticket",
      "Capture product issues and support requests.",
      "LifeBuoy",
      "Support",
      "{\"title\":\"Support Ticket\",\"description\":\"Describe the issue so we can help quickly.\",\"steps\":[{\"title\":\"Contact\",\"description\":\"How can we reach you?\",\"fields\":[{\"type\":\"text\",\"label\":\"Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Company\",\"required\":false,\"orderIndex\":2}]},{\"title\":\"Issue Details\",\"description\":\"Problem details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Product/Module\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Severity\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Critical\",\"value\":\"critical\"},{\"label\":\"High\",\"value\":\"high\"},{\"label\":\"Medium\",\"value\":\"medium\"},{\"label\":\"Low\",\"value\":\"low\"}]},{\"type\":\"textarea\",\"label\":\"Steps to reproduce\",\"required\":true,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Lead Qualification",
      "Score and qualify inbound leads.",
      "Sparkles",
      "Sales",
      "{\"title\":\"Lead Qualification\",\"description\":\"Help us understand your needs.\",\"steps\":[{\"title\":\"Basics\",\"description\":\"Contact information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Company\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Fit\",\"description\":\"Your goals and size.\",\"fields\":[{\"type\":\"select\",\"label\":\"Company Size\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"1-10\",\"value\":\"1-10\"},{\"label\":\"11-50\",\"value\":\"11-50\"},{\"label\":\"51-200\",\"value\":\"51-200\"},{\"label\":\"201+\",\"value\":\"201+\"}]},{\"type\":\"select\",\"label\":\"Timeline\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Immediate\",\"value\":\"immediate\"},{\"label\":\"1-3 months\",\"value\":\"1-3m\"},{\"label\":\"3-6 months\",\"value\":\"3-6m\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Sales Demo Request",
      "Collect demo requests with qualification details.",
      "Presentation",
      "Sales",
      "{\"title\":\"Sales Demo Request\",\"description\":\"Request a personalized demo.\",\"steps\":[{\"title\":\"Contact\",\"description\":\"Your details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Company\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Needs\",\"description\":\"What do you need?\",\"fields\":[{\"type\":\"select\",\"label\":\"Primary Goal\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Increase Revenue\",\"value\":\"revenue\"},{\"label\":\"Reduce Churn\",\"value\":\"churn\"},{\"label\":\"Improve Ops\",\"value\":\"ops\"}]},{\"type\":\"select\",\"label\":\"Team Size\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"1-10\",\"value\":\"1-10\"},{\"label\":\"11-50\",\"value\":\"11-50\"},{\"label\":\"51-200\",\"value\":\"51-200\"},{\"label\":\"201+\",\"value\":\"201+\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Vendor Onboarding",
      "Collect vendor details, tax info, and documents.",
      "Building2",
      "Operations",
      "{\"title\":\"Vendor Onboarding\",\"description\":\"Set up a new vendor account.\",\"steps\":[{\"title\":\"Company Info\",\"description\":\"Business details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Legal Business Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Business Address\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Primary Contact\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Compliance\",\"description\":\"Tax and banking.\",\"fields\":[{\"type\":\"text\",\"label\":\"Tax ID\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Bank Name\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Account Number\",\"required\":true,\"orderIndex\":2},{\"type\":\"file\",\"label\":\"W-9 / Tax Document\",\"required\":false,\"orderIndex\":3}]}]}"
    ));
    templates.add(buildTemplate(
      "Expense Reimbursement",
      "Submit expenses with receipts.",
      "Receipt",
      "Finance",
      "{\"title\":\"Expense Reimbursement\",\"description\":\"Submit expenses for reimbursement.\",\"steps\":[{\"title\":\"Employee\",\"description\":\"Your details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1}]},{\"title\":\"Expense\",\"description\":\"Expense details.\",\"fields\":[{\"type\":\"date\",\"label\":\"Expense Date\",\"required\":true,\"orderIndex\":0},{\"type\":\"number\",\"label\":\"Amount\",\"required\":true,\"orderIndex\":1},{\"type\":\"textarea\",\"label\":\"Description\",\"required\":true,\"orderIndex\":2},{\"type\":\"file\",\"label\":\"Receipt\",\"required\":true,\"orderIndex\":3}]}]}"
    ));
    templates.add(buildTemplate(
      "Property Showing Request",
      "Schedule a property visit.",
      "Home",
      "Real Estate",
      "{\"title\":\"Property Showing Request\",\"description\":\"Request a showing.\",\"steps\":[{\"title\":\"Contact\",\"description\":\"Your details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Schedule\",\"description\":\"Select preferred time.\",\"fields\":[{\"type\":\"date\",\"label\":\"Preferred Date\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Preferred Time\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Morning\",\"value\":\"morning\"},{\"label\":\"Afternoon\",\"value\":\"afternoon\"},{\"label\":\"Evening\",\"value\":\"evening\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Contract Review Request",
      "Submit a contract for review.",
      "Scale",
      "Legal",
      "{\"title\":\"Contract Review Request\",\"description\":\"Upload and summarize contract details.\",\"steps\":[{\"title\":\"Requester\",\"description\":\"Who is requesting?\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Department\",\"required\":false,\"orderIndex\":2}]},{\"title\":\"Contract\",\"description\":\"Contract details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Counterparty\",\"required\":true,\"orderIndex\":0},{\"type\":\"date\",\"label\":\"Effective Date\",\"required\":true,\"orderIndex\":1},{\"type\":\"file\",\"label\":\"Contract File\",\"required\":true,\"orderIndex\":2},{\"type\":\"textarea\",\"label\":\"Summary / Notes\",\"required\":false,\"orderIndex\":3}]}]}"
    ));
    templates.add(buildTemplate(
      "Refund Request",
      "Process refunds with evidence.",
      "Banknote",
      "Finance",
      "{\"title\":\"Refund Request\",\"description\":\"Submit a refund request with proof.\",\"steps\":[{\"title\":\"Order Details\",\"description\":\"Purchase information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Order ID\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email Used\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Product Name\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Reason\",\"description\":\"Tell us what happened.\",\"fields\":[{\"type\":\"select\",\"label\":\"Reason\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Defective\",\"value\":\"defective\"},{\"label\":\"Wrong Item\",\"value\":\"wrong\"},{\"label\":\"Not Needed\",\"value\":\"not_needed\"}]} ,{\"type\":\"textarea\",\"label\":\"Details\",\"required\":false,\"orderIndex\":1},{\"type\":\"file\",\"label\":\"Proof / Images\",\"required\":false,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Project Brief",
      "Define goals, scope, and deliverables.",
      "ClipboardCheck",
      "Product",
      "{\"title\":\"Project Brief\",\"description\":\"Align on scope and outcomes.\",\"steps\":[{\"title\":\"Overview\",\"description\":\"Project basics.\",\"fields\":[{\"type\":\"text\",\"label\":\"Project Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"textarea\",\"label\":\"Objective\",\"required\":true,\"orderIndex\":1}]},{\"title\":\"Scope\",\"description\":\"Requirements and constraints.\",\"fields\":[{\"type\":\"textarea\",\"label\":\"Key Requirements\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Budget Range\",\"required\":false,\"orderIndex\":1,\"options\":[{\"label\":\"< $5k\",\"value\":\"lt5\"},{\"label\":\"$5k-$25k\",\"value\":\"5-25\"},{\"label\":\"> $25k\",\"value\":\"gt25\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Incident Report",
      "Report safety or operational incidents.",
      "ShieldAlert",
      "Operations",
      "{\"title\":\"Incident Report\",\"description\":\"Report an incident with details.\",\"steps\":[{\"title\":\"Incident Details\",\"description\":\"What happened?\",\"fields\":[{\"type\":\"date\",\"label\":\"Date of Incident\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Location\",\"required\":true,\"orderIndex\":1},{\"type\":\"textarea\",\"label\":\"Description\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Evidence\",\"description\":\"Attach any evidence.\",\"fields\":[{\"type\":\"file\",\"label\":\"Photos / Videos\",\"required\":false,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Witness Names\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Travel Request",
      "Request and approve travel plans.",
      "Plane",
      "Operations",
      "{\"title\":\"Travel Request\",\"description\":\"Submit travel details for approval.\",\"steps\":[{\"title\":\"Trip Info\",\"description\":\"Destination and dates.\",\"fields\":[{\"type\":\"text\",\"label\":\"Destination\",\"required\":true,\"orderIndex\":0},{\"type\":\"date\",\"label\":\"Departure Date\",\"required\":true,\"orderIndex\":1},{\"type\":\"date\",\"label\":\"Return Date\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Budget\",\"description\":\"Costs and justification.\",\"fields\":[{\"type\":\"number\",\"label\":\"Estimated Cost\",\"required\":true,\"orderIndex\":0},{\"type\":\"textarea\",\"label\":\"Business Justification\",\"required\":true,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Asset Checkout",
      "Track equipment loans and returns.",
      "Package",
      "IT",
      "{\"title\":\"Asset Checkout\",\"description\":\"Request equipment checkout.\",\"steps\":[{\"title\":\"Requester\",\"description\":\"Contact details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1}]},{\"title\":\"Asset Details\",\"description\":\"What do you need?\",\"fields\":[{\"type\":\"select\",\"label\":\"Asset Type\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Laptop\",\"value\":\"laptop\"},{\"label\":\"Monitor\",\"value\":\"monitor\"},{\"label\":\"Phone\",\"value\":\"phone\"},{\"label\":\"Accessory\",\"value\":\"accessory\"}]},{\"type\":\"date\",\"label\":\"Checkout Date\",\"required\":true,\"orderIndex\":1},{\"type\":\"date\",\"label\":\"Return Date\",\"required\":false,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Real Estate Inquiry",
      "Capture property interest and budget.",
      "MapPin",
      "Real Estate",
      "{\"title\":\"Real Estate Inquiry\",\"description\":\"Tell us about your property needs.\",\"steps\":[{\"title\":\"Buyer Info\",\"description\":\"Contact details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Preferences\",\"description\":\"Property requirements.\",\"fields\":[{\"type\":\"select\",\"label\":\"Property Type\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Apartment\",\"value\":\"apartment\"},{\"label\":\"House\",\"value\":\"house\"},{\"label\":\"Commercial\",\"value\":\"commercial\"}]},{\"type\":\"select\",\"label\":\"Budget Range\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"< $250k\",\"value\":\"lt250\"},{\"label\":\"$250k-$500k\",\"value\":\"250-500\"},{\"label\":\"> $500k\",\"value\":\"gt500\"}]}]}]}"
    ));
    templates.add(buildTemplate(
      "Compliance Consent",
      "Collect consent and acknowledgment.",
      "ClipboardSignature",
      "Legal",
      "{\"title\":\"Compliance Consent\",\"description\":\"Review and acknowledge policies.\",\"steps\":[{\"title\":\"Acknowledgment\",\"description\":\"Please confirm.\",\"fields\":[{\"type\":\"checkbox\",\"label\":\"I acknowledge the policy terms\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Full Legal Name\",\"required\":true,\"orderIndex\":1},{\"type\":\"date\",\"label\":\"Date\",\"required\":true,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Employee Onboarding",
      "Collect new hire info and documents.",
      "UserCheck",
      "HR",
      "{\"title\":\"Employee Onboarding\",\"description\":\"Welcome to the team!\",\"steps\":[{\"title\":\"Personal Details\",\"description\":\"Basic information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Personal Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Employment\",\"description\":\"Role and start details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Job Title\",\"required\":true,\"orderIndex\":0},{\"type\":\"date\",\"label\":\"Start Date\",\"required\":true,\"orderIndex\":1},{\"type\":\"select\",\"label\":\"Employment Type\",\"required\":true,\"orderIndex\":2,\"options\":[{\"label\":\"Full-time\",\"value\":\"full_time\"},{\"label\":\"Part-time\",\"value\":\"part_time\"},{\"label\":\"Contract\",\"value\":\"contract\"}]}]},{\"title\":\"Documents\",\"description\":\"Upload required files.\",\"fields\":[{\"type\":\"file\",\"label\":\"ID Proof\",\"required\":true,\"orderIndex\":0},{\"type\":\"file\",\"label\":\"Signed Offer\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Bug Report",
      "Capture reproducible issues with context.",
      "Bug",
      "Support",
      "{\"title\":\"Bug Report\",\"description\":\"Help us fix issues faster.\",\"steps\":[{\"title\":\"Reporter\",\"description\":\"Contact details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1}]},{\"title\":\"Issue\",\"description\":\"Problem details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Product Area\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Severity\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Critical\",\"value\":\"critical\"},{\"label\":\"High\",\"value\":\"high\"},{\"label\":\"Medium\",\"value\":\"medium\"},{\"label\":\"Low\",\"value\":\"low\"}]},{\"type\":\"textarea\",\"label\":\"Steps to reproduce\",\"required\":true,\"orderIndex\":2},{\"type\":\"file\",\"label\":\"Screenshots / Logs\",\"required\":false,\"orderIndex\":3}]}]}"
    ));
    templates.add(buildTemplate(
      "Scholarship Application",
      "Collect student profile and documents.",
      "GraduationCap",
      "Education",
      "{\"title\":\"Scholarship Application\",\"description\":\"Apply for scholarship consideration.\",\"steps\":[{\"title\":\"Student Info\",\"description\":\"Basic details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"University\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Academic\",\"description\":\"Program details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Major\",\"required\":true,\"orderIndex\":0},{\"type\":\"number\",\"label\":\"Current GPA\",\"required\":true,\"orderIndex\":1},{\"type\":\"textarea\",\"label\":\"Academic achievements\",\"required\":false,\"orderIndex\":2}]},{\"title\":\"Documents\",\"description\":\"Upload required files.\",\"fields\":[{\"type\":\"file\",\"label\":\"Transcript\",\"required\":true,\"orderIndex\":0},{\"type\":\"file\",\"label\":\"Recommendation Letter\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "Clinic Appointment",
      "Book an appointment with preferences.",
      "Calendar",
      "Healthcare",
      "{\"title\":\"Clinic Appointment\",\"description\":\"Request an appointment.\",\"steps\":[{\"title\":\"Patient\",\"description\":\"Contact information.\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Phone\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Appointment\",\"description\":\"Schedule preferences.\",\"fields\":[{\"type\":\"date\",\"label\":\"Preferred Date\",\"required\":true,\"orderIndex\":0},{\"type\":\"select\",\"label\":\"Preferred Time\",\"required\":true,\"orderIndex\":1,\"options\":[{\"label\":\"Morning\",\"value\":\"morning\"},{\"label\":\"Afternoon\",\"value\":\"afternoon\"},{\"label\":\"Evening\",\"value\":\"evening\"}]},{\"type\":\"textarea\",\"label\":\"Reason for visit\",\"required\":false,\"orderIndex\":2}]}]}"
    ));
    templates.add(buildTemplate(
      "Event Sponsorship",
      "Collect sponsor interest and assets.",
      "Handshake",
      "Events",
      "{\"title\":\"Event Sponsorship\",\"description\":\"Partner with our event.\",\"steps\":[{\"title\":\"Company\",\"description\":\"Sponsor details.\",\"fields\":[{\"type\":\"text\",\"label\":\"Company Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"text\",\"label\":\"Contact Name\",\"required\":true,\"orderIndex\":1},{\"type\":\"email\",\"label\":\"Contact Email\",\"required\":true,\"orderIndex\":2}]},{\"title\":\"Package\",\"description\":\"Select a sponsorship tier.\",\"fields\":[{\"type\":\"select\",\"label\":\"Package\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"Gold\",\"value\":\"gold\"},{\"label\":\"Silver\",\"value\":\"silver\"},{\"label\":\"Bronze\",\"value\":\"bronze\"}]},{\"type\":\"file\",\"label\":\"Logo / Brand Assets\",\"required\":false,\"orderIndex\":1}]}]}"
    ));
    templates.add(buildTemplate(
      "IT Access Request",
      "Request tools, apps, and permissions.",
      "KeyRound",
      "IT",
      "{\"title\":\"IT Access Request\",\"description\":\"Request access to systems and tools.\",\"steps\":[{\"title\":\"Requester\",\"description\":\"Who needs access?\",\"fields\":[{\"type\":\"text\",\"label\":\"Full Name\",\"required\":true,\"orderIndex\":0},{\"type\":\"email\",\"label\":\"Work Email\",\"required\":true,\"orderIndex\":1},{\"type\":\"text\",\"label\":\"Department\",\"required\":false,\"orderIndex\":2}]},{\"title\":\"Access\",\"description\":\"Select what you need.\",\"fields\":[{\"type\":\"select\",\"label\":\"Tool\",\"required\":true,\"orderIndex\":0,\"options\":[{\"label\":\"GitHub\",\"value\":\"github\"},{\"label\":\"Jira\",\"value\":\"jira\"},{\"label\":\"Slack\",\"value\":\"slack\"},{\"label\":\"Google Workspace\",\"value\":\"google\"}]},{\"type\":\"textarea\",\"label\":\"Justification\",\"required\":true,\"orderIndex\":1}]}]}"
    ));
    templateRepository.saveAll(templates);
  }

  private Template buildTemplate(String name, String description, String icon, String category, String configJson) {
    Template template = new Template();
    template.setName(name);
    template.setDescription(description);
    template.setIcon(icon);
    template.setCategory(category);
    try {
      Map<String, Object> config = objectMapper.readValue(configJson, new TypeReference<>() {});
      template.setConfig(config);
    } catch (Exception e) {
      template.setConfig(new HashMap<>());
    }
    return template;
  }

  private Map<String, Object> normalizeToMap(JsonNode node) {
    if (node == null || node.isNull()) {
      return new HashMap<>();
    }
    return objectMapper.convertValue(node, new TypeReference<>() {});
  }

  private Map<String, Map<String, Object>> loadFieldRules(String formId) {
    Map<String, Map<String, Object>> rules = new HashMap<>();
    List<FormStep> steps = stepRepository.findAllByFormIdOrderByOrderIndexAsc(formId);
    Map<String, List<FormField>> fieldsByStep = fieldsByStepId(steps);
    for (FormStep step : steps) {
      List<FormField> fields = fieldsByStep.getOrDefault(step.getId(), List.of());
      for (FormField field : fields) {
        Object rawRules = field.getValidationRules();
        if (!(rawRules instanceof Map<?, ?> map)) {
          continue;
        }
        Map<String, Object> cast = new HashMap<>();
        for (Map.Entry<?, ?> entry : map.entrySet()) {
          if (entry.getKey() != null) {
            cast.put(String.valueOf(entry.getKey()), entry.getValue());
          }
        }
        rules.put("field_" + field.getId(), cast);
      }
    }
    return rules;
  }

  private void validateFilesAgainstRules(String dataKey, List<MultipartFile> files, Map<String, Map<String, Object>> fieldRules) {
    Map<String, Object> rules = fieldRules.get(dataKey);
    if (rules == null) {
      return;
    }
    int maxFiles = rules.get("maxFiles") instanceof Number n ? n.intValue() : 3;
    int maxSizeMb = rules.get("maxSizeMb") instanceof Number n ? n.intValue() : 10;
    long maxSizeBytes = maxSizeMb * 1024L * 1024L;

    long count = files == null ? 0 : files.stream().filter(f -> f != null && !f.isEmpty()).count();
    if (count > maxFiles) {
      throw new IllegalArgumentException("Too many files uploaded. Max " + maxFiles);
    }
    if (files != null) {
      for (MultipartFile file : files) {
        if (file == null || file.isEmpty()) {
          continue;
        }
        if (file.getSize() > maxSizeBytes) {
          throw new IllegalArgumentException("File too large. Max " + maxSizeMb + "MB");
        }
      }
    }
  }

  private Object normalizeToObject(JsonNode node) {
    if (node == null || node.isNull()) {
      return null;
    }
    return objectMapper.convertValue(node, Object.class);
  }

  private Map<String, Object> defaultFileRules() {
    Map<String, Object> rules = new HashMap<>();
    rules.put("multiple", true);
    rules.put("maxFiles", 3);
    rules.put("maxSizeMb", 10);
    return rules;
  }

  private FormDto toFormDto(Form form) {
    return new FormDto(
      form.getId(),
      form.getUserId(),
      form.getTitle(),
      form.getDescription(),
      form.isPublished(),
      form.getCreatedAt(),
      form.getUpdatedAt(),
      form.getTheme()
    );
  }

  private FormWithStepsDto toFormWithStepsDto(Form form) {
    List<FormStep> steps = stepRepository.findAllByFormIdOrderByOrderIndexAsc(form.getId());
    Map<String, List<FormField>> fieldsByStep = fieldsByStepId(steps);
    List<StepDto> stepDtos = new ArrayList<>();

    for (FormStep step : steps) {
      List<FormField> fields = fieldsByStep.getOrDefault(step.getId(), List.of());
      List<FieldDto> fieldDtos = fields.stream().map(this::toFieldDto).toList();
      stepDtos.add(toStepDto(step, fieldDtos));
    }

    return new FormWithStepsDto(
      form.getId(),
      form.getUserId(),
      form.getTitle(),
      form.getDescription(),
      form.isPublished(),
      form.getCreatedAt(),
      form.getUpdatedAt(),
      stepDtos,
      form.getTheme()
    );
  }

  private StepDto toStepDto(FormStep step, List<FieldDto> fields) {
    return new StepDto(
      step.getId(),
      step.getFormId(),
      step.getTitle(),
      step.getDescription(),
      step.getOrderIndex(),
      fields
    );
  }

  private Map<String, List<FormField>> fieldsByStepId(List<FormStep> steps) {
    if (steps == null || steps.isEmpty()) {
      return Map.of();
    }
    List<String> stepIds = steps.stream().map(FormStep::getId).toList();
    List<FormField> fields = fieldRepository.findAllByStepIdIn(stepIds);
    Map<String, List<FormField>> fieldsByStep = new HashMap<>();
    for (FormField field : fields) {
      fieldsByStep.computeIfAbsent(field.getStepId(), ignored -> new ArrayList<>()).add(field);
    }
    fieldsByStep.values().forEach(list -> list.sort(java.util.Comparator.comparing(FormField::getOrderIndex)));
    return fieldsByStep;
  }

  private FieldDto toFieldDto(FormField field) {
    return new FieldDto(
      field.getId(),
      field.getStepId(),
      field.getType(),
      field.getLabel(),
      field.getPlaceholder(),
      field.getDefaultValue(),
      field.isRequired(),
      field.getOrderIndex(),
      field.getOptions(),
      field.getValidationRules()
    );
  }

  private SubmissionDto toSubmissionDto(Submission submission) {
    return new SubmissionDto(
      submission.getId(),
      submission.getFormId(),
      submission.getData(),
      submission.getSubmittedAt()
    );
  }

  private String buildCsv(List<Submission> submissions) {
    if (submissions == null || submissions.isEmpty()) {
      return "Submitted At\n";
    }

    TreeSet<String> keys = new TreeSet<>();
    for (Submission submission : submissions) {
      Object data = submission.getData();
      if (data instanceof Map<?, ?> map) {
        for (Object key : map.keySet()) {
          if (key != null) {
            keys.add(String.valueOf(key));
          }
        }
      }
    }

    List<String> headers = new ArrayList<>();
    headers.add("Submitted At");
    headers.addAll(keys);

    StringBuilder sb = new StringBuilder();
    sb.append(String.join(",", headers)).append("\n");
    for (Submission submission : submissions) {
      List<String> row = new ArrayList<>();
      row.add(escapeCsv(formatSubmissionInstant(submission.getSubmittedAt())));
      Map<String, Object> data = submission.getData() instanceof Map<?, ?> map ? castMap(map) : Map.of();
      for (String key : keys) {
        Object value = data.get(key);
        row.add(escapeCsv(renderCsvValue(value)));
      }
      sb.append(String.join(",", row)).append("\n");
    }
    return sb.toString();
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> castMap(Map<?, ?> map) {
    Map<String, Object> result = new HashMap<>();
    for (Map.Entry<?, ?> entry : map.entrySet()) {
      if (entry.getKey() != null) {
        result.put(String.valueOf(entry.getKey()), entry.getValue());
      }
    }
    return result;
  }

  private String renderCsvValue(Object value) {
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
    }
    return String.valueOf(value);
  }

  private String escapeCsv(String value) {
    String safe = value == null ? "" : value.replace("\"", "\"\"");
    return "\"" + safe + "\"";
  }

  private String formatSubmissionInstant(Instant instant) {
    return instant == null ? "" : SUBMISSION_TIME_FORMATTER.format(instant);
  }

  public record SubmissionExport(Form form, List<Submission> submissions, List<FormFile> files, String csv) {}
}
