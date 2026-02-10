package com.formweaverai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.formweaverai.dto.*;
import com.formweaverai.model.*;
import com.formweaverai.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FormService {
  private final FormRepository formRepository;
  private final FormStepRepository stepRepository;
  private final FormFieldRepository fieldRepository;
  private final SubmissionRepository submissionRepository;
  private final TemplateRepository templateRepository;
  private final ObjectMapper objectMapper;

  public FormService(
    FormRepository formRepository,
    FormStepRepository stepRepository,
    FormFieldRepository fieldRepository,
    SubmissionRepository submissionRepository,
    TemplateRepository templateRepository,
    ObjectMapper objectMapper
  ) {
    this.formRepository = formRepository;
    this.stepRepository = stepRepository;
    this.fieldRepository = fieldRepository;
    this.submissionRepository = submissionRepository;
    this.templateRepository = templateRepository;
    this.objectMapper = objectMapper;
  }

  public List<FormDto> listForms(String userId) {
    return formRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
      .stream()
      .map(this::toFormDto)
      .toList();
  }

  public Optional<FormWithStepsDto> getFormWithSteps(Long id) {
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
    return toFormDto(formRepository.save(form));
  }

  @Transactional
  public Optional<FormDto> updateForm(Long id, UpdateFormRequest request) {
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
      return toFormDto(formRepository.save(form));
    });
  }

  @Transactional
  public boolean deleteForm(Long id) {
    return formRepository.findById(id).map(form -> {
      List<FormStep> steps = stepRepository.findAllByFormOrderByOrderIndexAsc(form);
      for (FormStep step : steps) {
        List<FormField> fields = fieldRepository.findAllByStepOrderByOrderIndexAsc(step);
        if (!fields.isEmpty()) {
          fieldRepository.deleteAll(fields);
        }
      }
      if (!steps.isEmpty()) {
        stepRepository.deleteAll(steps);
      }
      List<Submission> submissions = submissionRepository.findAllByFormOrderBySubmittedAtDesc(form);
      if (!submissions.isEmpty()) {
        submissionRepository.deleteAll(submissions);
      }
      formRepository.delete(form);
      return true;
    }).orElse(false);
  }

  @Transactional
  public Optional<FormDto> publishForm(Long id) {
    return formRepository.findById(id).map(form -> {
      form.setPublished(!form.isPublished());
      return toFormDto(formRepository.save(form));
    });
  }

  @Transactional
  public Optional<StepDto> createStep(Long formId, CreateStepRequest request) {
    return formRepository.findById(formId).map(form -> {
      FormStep step = new FormStep();
      step.setForm(form);
      step.setTitle(request.title());
      step.setDescription(request.description());
      int orderIndex = (int) stepRepository.countByForm(form);
      step.setOrderIndex(orderIndex);
      return toStepDto(stepRepository.save(step), List.of());
    });
  }

  @Transactional
  public Optional<StepDto> updateStep(Long stepId, UpdateStepRequest request) {
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
  public boolean deleteStep(Long stepId) {
    if (!stepRepository.existsById(stepId)) {
      return false;
    }
    stepRepository.deleteById(stepId);
    return true;
  }

  @Transactional
  public Optional<FieldDto> createField(Long stepId, CreateFieldRequest request) {
    return stepRepository.findById(stepId).map(step -> {
      FormField field = new FormField();
      field.setStep(step);
      field.setType(request.type());
      field.setLabel(request.label());
      field.setPlaceholder(request.placeholder());
      field.setDefaultValue(request.defaultValue());
      field.setRequired(request.required() != null && request.required());
      int orderIndex = (int) fieldRepository.countByStep(step);
      field.setOrderIndex(orderIndex);
      field.setOptions(request.options());
      field.setValidationRules(request.validationRules());
      return toFieldDto(fieldRepository.save(field));
    });
  }

  @Transactional
  public Optional<FieldDto> updateField(Long fieldId, UpdateFieldRequest request) {
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
        field.setOptions(request.options());
      }
      if (request.validationRules() != null) {
        field.setValidationRules(request.validationRules());
      }
      return toFieldDto(fieldRepository.save(field));
    });
  }

  @Transactional
  public boolean deleteField(Long fieldId) {
    if (!fieldRepository.existsById(fieldId)) {
      return false;
    }
    fieldRepository.deleteById(fieldId);
    return true;
  }

  @Transactional
  public Optional<SubmissionDto> createSubmission(Long formId, SubmitFormRequest request) {
    return formRepository.findById(formId).map(form -> {
      Submission submission = new Submission();
      submission.setForm(form);
      submission.setData(request.data());
      return toSubmissionDto(submissionRepository.save(submission));
    });
  }

  public Optional<List<SubmissionDto>> listSubmissions(Long formId) {
    return formRepository.findById(formId).map(form ->
      submissionRepository.findAllByFormOrderBySubmittedAtDesc(form)
        .stream()
        .map(this::toSubmissionDto)
        .toList()
    );
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
      step.setForm(form);
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
        field.setStep(step);
        field.setType(fieldInput.type() == null ? "text" : fieldInput.type());
        field.setLabel(fieldInput.label() == null ? "Field" : fieldInput.label());
        field.setPlaceholder(fieldInput.placeholder());
        field.setRequired(fieldInput.required() != null && fieldInput.required());
        field.setOrderIndex(fieldIndex++);
        if (fieldInput.options() != null) {
          JsonNode optionsNode = objectMapper.valueToTree(fieldInput.options());
          field.setOptions(optionsNode);
        }
        fieldRepository.save(field);
      }
    }

    return Optional.of(toFormWithStepsDto(form));
  }

  public void seedTemplatesIfEmpty() {
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
    List<Template> toInsert = templates.stream()
      .filter(template -> !templateRepository.existsByName(template.getName()))
      .toList();
    if (!toInsert.isEmpty()) {
      templateRepository.saveAll(toInsert);
    }
  }

  private Template buildTemplate(String name, String description, String icon, String category, String configJson) {
    Template template = new Template();
    template.setName(name);
    template.setDescription(description);
    template.setIcon(icon);
    template.setCategory(category);
    try {
      template.setConfig(objectMapper.readTree(configJson));
    } catch (Exception e) {
      template.setConfig(objectMapper.createObjectNode());
    }
    return template;
  }

  private FormDto toFormDto(Form form) {
    return new FormDto(
      form.getId(),
      form.getUserId(),
      form.getTitle(),
      form.getDescription(),
      form.isPublished(),
      form.getCreatedAt(),
      form.getUpdatedAt()
    );
  }

  private FormWithStepsDto toFormWithStepsDto(Form form) {
    List<FormStep> steps = stepRepository.findAllByFormOrderByOrderIndexAsc(form);
    List<StepDto> stepDtos = new ArrayList<>();

    for (FormStep step : steps) {
      List<FormField> fields = fieldRepository.findAllByStepOrderByOrderIndexAsc(step);
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
      stepDtos
    );
  }

  private StepDto toStepDto(FormStep step, List<FieldDto> fields) {
    return new StepDto(
      step.getId(),
      step.getForm().getId(),
      step.getTitle(),
      step.getDescription(),
      step.getOrderIndex(),
      fields
    );
  }

  private FieldDto toFieldDto(FormField field) {
    return new FieldDto(
      field.getId(),
      field.getStep().getId(),
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
      submission.getForm().getId(),
      submission.getData(),
      submission.getSubmittedAt()
    );
  }
}
