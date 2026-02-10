package com.formweaverai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.formweaverai.dto.TemplateDto;
import com.formweaverai.model.Template;
import com.formweaverai.repository.TemplateRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TemplateController {
  private final TemplateRepository templateRepository;
  private final ObjectMapper objectMapper;

  public TemplateController(TemplateRepository templateRepository, ObjectMapper objectMapper) {
    this.templateRepository = templateRepository;
    this.objectMapper = objectMapper;
  }

  @GetMapping("/templates")
  public List<TemplateDto> listTemplates() {
    return templateRepository.findAll().stream().map(this::toDto).toList();
  }

  @PostMapping("/templates/init")
  public String initializeTemplates() {
    try {
      // Clear existing templates
      templateRepository.deleteAll();
      
      // Create Contact Form template with proper JSON config
      Template contactForm = new Template();
      contactForm.setName("Contact Form");
      contactForm.setDescription("Simple contact form for websites.");
      contactForm.setIcon("Mail");
      contactForm.setCategory("Business");
      
      ObjectNode contactConfig = objectMapper.createObjectNode();
      contactConfig.put("title", "Contact Us");
      contactConfig.put("description", "We would love to hear from you.");
      
      ArrayNode contactSteps = objectMapper.createArrayNode();
      ObjectNode contactStep = objectMapper.createObjectNode();
      contactStep.put("title", "Your Details");
      contactStep.put("description", "Let us know who you are.");
      
      ArrayNode contactFields = objectMapper.createArrayNode();
      ObjectNode contactField1 = objectMapper.createObjectNode();
      contactField1.put("type", "text");
      contactField1.put("label", "Name");
      contactField1.put("required", true);
      contactField1.put("orderIndex", 0);
      
      ObjectNode contactField2 = objectMapper.createObjectNode();
      contactField2.put("type", "text");
      contactField2.put("label", "Email");
      contactField2.put("required", true);
      contactField2.put("orderIndex", 1);
      
      ObjectNode contactField3 = objectMapper.createObjectNode();
      contactField3.put("type", "textarea");
      contactField3.put("label", "Message");
      contactField3.put("required", true);
      contactField3.put("orderIndex", 2);
      
      contactFields.add(contactField1);
      contactFields.add(contactField2);
      contactFields.add(contactField3);
      contactStep.set("fields", contactFields);
      contactSteps.add(contactStep);
      contactConfig.set("steps", contactSteps);
      
      contactForm.setConfig(contactConfig);
      templateRepository.save(contactForm);
      
      // Create Job Application template
      Template jobForm = new Template();
      jobForm.setName("Job Application");
      jobForm.setDescription("Standard job application form.");
      jobForm.setIcon("Briefcase");
      jobForm.setCategory("HR");
      
      ObjectNode jobConfig = objectMapper.createObjectNode();
      jobConfig.put("title", "Job Application");
      jobConfig.put("description", "Apply for our open positions.");
      
      ArrayNode jobSteps = objectMapper.createArrayNode();
      
      ObjectNode jobStep1 = objectMapper.createObjectNode();
      jobStep1.put("title", "Personal Info");
      jobStep1.put("description", "Basic information.");
      
      ArrayNode jobFields1 = objectMapper.createArrayNode();
      ObjectNode jobField1 = objectMapper.createObjectNode();
      jobField1.put("type", "text");
      jobField1.put("label", "Full Name");
      jobField1.put("required", true);
      jobField1.put("orderIndex", 0);
      
      ObjectNode jobField2 = objectMapper.createObjectNode();
      jobField2.put("type", "text");
      jobField2.put("label", "Email");
      jobField2.put("required", true);
      jobField2.put("orderIndex", 1);
      
      ObjectNode jobField3 = objectMapper.createObjectNode();
      jobField3.put("type", "text");
      jobField3.put("label", "Phone");
      jobField3.put("required", false);
      jobField3.put("orderIndex", 2);
      
      jobFields1.add(jobField1);
      jobFields1.add(jobField2);
      jobFields1.add(jobField3);
      jobStep1.set("fields", jobFields1);
      jobSteps.add(jobStep1);
      
      ObjectNode jobStep2 = objectMapper.createObjectNode();
      jobStep2.put("title", "Experience");
      jobStep2.put("description", "Tell us about your work history.");
      
      ArrayNode jobFields2 = objectMapper.createArrayNode();
      ObjectNode jobField4 = objectMapper.createObjectNode();
      jobField4.put("type", "textarea");
      jobField4.put("label", "Resume / Cover Letter");
      jobField4.put("required", true);
      jobField4.put("orderIndex", 0);
      
      ObjectNode jobField5 = objectMapper.createObjectNode();
      jobField5.put("type", "text");
      jobField5.put("label", "LinkedIn Profile");
      jobField5.put("required", false);
      jobField5.put("orderIndex", 1);
      
      jobFields2.add(jobField4);
      jobFields2.add(jobField5);
      jobStep2.set("fields", jobFields2);
      jobSteps.add(jobStep2);
      
      jobConfig.set("steps", jobSteps);
      
      jobForm.setConfig(jobConfig);
      templateRepository.save(jobForm);
      
      // Create Event Registration template
      Template eventForm = new Template();
      eventForm.setName("Event Registration");
      eventForm.setDescription("Register attendees for an event.");
      eventForm.setIcon("Calendar");
      eventForm.setCategory("Events");
      
      ObjectNode eventConfig = objectMapper.createObjectNode();
      eventConfig.put("title", "Event Registration");
      eventConfig.put("description", "Join us for our upcoming event.");
      
      ArrayNode eventSteps = objectMapper.createArrayNode();
      ObjectNode eventStep = objectMapper.createObjectNode();
      eventStep.put("title", "Attendee Info");
      eventStep.put("description", "Who is coming?");
      
      ArrayNode eventFields = objectMapper.createArrayNode();
      ObjectNode eventField1 = objectMapper.createObjectNode();
      eventField1.put("type", "text");
      eventField1.put("label", "Name");
      eventField1.put("required", true);
      eventField1.put("orderIndex", 0);
      
      ObjectNode eventField2 = objectMapper.createObjectNode();
      eventField2.put("type", "text");
      eventField2.put("label", "Email");
      eventField2.put("required", true);
      eventField2.put("orderIndex", 1);
      
      ObjectNode eventField3 = objectMapper.createObjectNode();
      eventField3.put("type", "select");
      eventField3.put("label", "Ticket Type");
      eventField3.put("required", true);
      eventField3.put("orderIndex", 2);
      
      ArrayNode eventOptions = objectMapper.createArrayNode();
      ObjectNode eventOption1 = objectMapper.createObjectNode();
      eventOption1.put("label", "General Admission");
      eventOption1.put("value", "general");
      
      ObjectNode eventOption2 = objectMapper.createObjectNode();
      eventOption2.put("label", "VIP");
      eventOption2.put("value", "vip");
      
      eventOptions.add(eventOption1);
      eventOptions.add(eventOption2);
      eventField3.set("options", eventOptions);
      
      eventFields.add(eventField1);
      eventFields.add(eventField2);
      eventFields.add(eventField3);
      eventStep.set("fields", eventFields);
      eventSteps.add(eventStep);
      eventConfig.set("steps", eventSteps);
      
      eventForm.setConfig(eventConfig);
      templateRepository.save(eventForm);
      
      // Create Student Registration template
      Template studentForm = new Template();
      studentForm.setName("Student Registration");
      studentForm.setDescription("Register students for courses and programs.");
      studentForm.setIcon("GraduationCap");
      studentForm.setCategory("Education");
      
      ObjectNode studentConfig = objectMapper.createObjectNode();
      studentConfig.put("title", "Student Registration");
      studentConfig.put("description", "Join our educational programs.");
      
      ArrayNode studentSteps = objectMapper.createArrayNode();
      
      ObjectNode studentStep1 = objectMapper.createObjectNode();
      studentStep1.put("title", "Personal Information");
      studentStep1.put("description", "Tell us about yourself.");
      
      ArrayNode studentFields1 = objectMapper.createArrayNode();
      ObjectNode studentField1 = objectMapper.createObjectNode();
      studentField1.put("type", "text");
      studentField1.put("label", "Full Name");
      studentField1.put("required", true);
      studentField1.put("orderIndex", 0);
      
      ObjectNode studentField2 = objectMapper.createObjectNode();
      studentField2.put("type", "text");
      studentField2.put("label", "Email");
      studentField2.put("required", true);
      studentField2.put("orderIndex", 1);
      
      ObjectNode studentField3 = objectMapper.createObjectNode();
      studentField3.put("type", "text");
      studentField3.put("label", "Phone");
      studentField3.put("required", false);
      studentField3.put("orderIndex", 2);
      
      ObjectNode studentField4 = objectMapper.createObjectNode();
      studentField4.put("type", "select");
      studentField4.put("label", "Grade Level");
      studentField4.put("required", true);
      studentField4.put("orderIndex", 3);
      
      ArrayNode gradeOptions = objectMapper.createArrayNode();
      ObjectNode gradeOption1 = objectMapper.createObjectNode();
      gradeOption1.put("label", "Elementary");
      gradeOption1.put("value", "elementary");
      ObjectNode gradeOption2 = objectMapper.createObjectNode();
      gradeOption2.put("label", "Middle School");
      gradeOption2.put("value", "middle");
      ObjectNode gradeOption3 = objectMapper.createObjectNode();
      gradeOption3.put("label", "High School");
      gradeOption3.put("value", "high");
      ObjectNode gradeOption4 = objectMapper.createObjectNode();
      gradeOption4.put("label", "College");
      gradeOption4.put("value", "college");
      gradeOptions.add(gradeOption1);
      gradeOptions.add(gradeOption2);
      gradeOptions.add(gradeOption3);
      gradeOptions.add(gradeOption4);
      studentField4.set("options", gradeOptions);
      
      studentFields1.add(studentField1);
      studentFields1.add(studentField2);
      studentFields1.add(studentField3);
      studentFields1.add(studentField4);
      studentStep1.set("fields", studentFields1);
      studentSteps.add(studentStep1);
      
      ObjectNode studentStep2 = objectMapper.createObjectNode();
      studentStep2.put("title", "Academic Information");
      studentStep2.put("description", "Educational background.");
      
      ArrayNode studentFields2 = objectMapper.createArrayNode();
      ObjectNode studentField5 = objectMapper.createObjectNode();
      studentField5.put("type", "text");
      studentField5.put("label", "Current School");
      studentField5.put("required", true);
      studentField5.put("orderIndex", 0);
      
      ObjectNode studentField6 = objectMapper.createObjectNode();
      studentField6.put("type", "textarea");
      studentField6.put("label", "Subjects of Interest");
      studentField6.put("required", true);
      studentField6.put("orderIndex", 1);
      
      ObjectNode studentField7 = objectMapper.createObjectNode();
      studentField7.put("type", "select");
      studentField7.put("label", "Program Type");
      studentField7.put("required", true);
      studentField7.put("orderIndex", 2);
      
      ArrayNode programOptions = objectMapper.createArrayNode();
      ObjectNode programOption1 = objectMapper.createObjectNode();
      programOption1.put("label", "Regular Classes");
      programOption1.put("value", "regular");
      ObjectNode programOption2 = objectMapper.createObjectNode();
      programOption2.put("label", "Advanced Placement");
      programOption2.put("value", "ap");
      ObjectNode programOption3 = objectMapper.createObjectNode();
      programOption3.put("label", "Extracurricular");
      programOption3.put("value", "extracurricular");
      programOptions.add(programOption1);
      programOptions.add(programOption2);
      programOptions.add(programOption3);
      studentField7.set("options", programOptions);
      
      studentFields2.add(studentField5);
      studentFields2.add(studentField6);
      studentFields2.add(studentField7);
      studentStep2.set("fields", studentFields2);
      studentSteps.add(studentStep2);
      
      studentConfig.set("steps", studentSteps);
      
      studentForm.setConfig(studentConfig);
      templateRepository.save(studentForm);
      
      // Create Medical History template
      Template medicalForm = new Template();
      medicalForm.setName("Medical History");
      medicalForm.setDescription("Patient medical history and health information.");
      medicalForm.setIcon("Heart");
      medicalForm.setCategory("Healthcare");
      
      ObjectNode medicalConfig = objectMapper.createObjectNode();
      medicalConfig.put("title", "Medical History");
      medicalConfig.put("description", "Complete health information.");
      
      ArrayNode medicalSteps = objectMapper.createArrayNode();
      
      ObjectNode medicalStep1 = objectMapper.createObjectNode();
      medicalStep1.put("title", "Patient Information");
      medicalStep1.put("description", "Basic patient details.");
      
      ArrayNode medicalFields1 = objectMapper.createArrayNode();
      ObjectNode medicalField1 = objectMapper.createObjectNode();
      medicalField1.put("type", "text");
      medicalField1.put("label", "Full Name");
      medicalField1.put("required", true);
      medicalField1.put("orderIndex", 0);
      
      ObjectNode medicalField2 = objectMapper.createObjectNode();
      medicalField2.put("type", "text");
      medicalField2.put("label", "Email");
      medicalField2.put("required", true);
      medicalField2.put("orderIndex", 1);
      
      ObjectNode medicalField3 = objectMapper.createObjectNode();
      medicalField3.put("type", "text");
      medicalField3.put("label", "Phone");
      medicalField3.put("required", true);
      medicalField3.put("orderIndex", 2);
      
      ObjectNode medicalField4 = objectMapper.createObjectNode();
      medicalField4.put("type", "date");
      medicalField4.put("label", "Date of Birth");
      medicalField4.put("required", true);
      medicalField4.put("orderIndex", 3);
      
      medicalFields1.add(medicalField1);
      medicalFields1.add(medicalField2);
      medicalFields1.add(medicalField3);
      medicalFields1.add(medicalField4);
      medicalStep1.set("fields", medicalFields1);
      medicalSteps.add(medicalStep1);
      
      ObjectNode medicalStep2 = objectMapper.createObjectNode();
      medicalStep2.put("title", "Medical Information");
      medicalStep2.put("description", "Health and medical history.");
      
      ArrayNode medicalFields2 = objectMapper.createArrayNode();
      ObjectNode medicalField5 = objectMapper.createObjectNode();
      medicalField5.put("type", "select");
      medicalField5.put("label", "Blood Type");
      medicalField5.put("required", false);
      medicalField5.put("orderIndex", 0);
      
      ArrayNode bloodOptions = objectMapper.createArrayNode();
      ObjectNode bloodOption1 = objectMapper.createObjectNode();
      bloodOption1.put("label", "A+");
      bloodOption1.put("value", "a_plus");
      ObjectNode bloodOption2 = objectMapper.createObjectNode();
      bloodOption2.put("label", "A-");
      bloodOption2.put("value", "a_minus");
      ObjectNode bloodOption3 = objectMapper.createObjectNode();
      bloodOption3.put("label", "B+");
      bloodOption3.put("value", "b_plus");
      ObjectNode bloodOption4 = objectMapper.createObjectNode();
      bloodOption4.put("label", "B-");
      bloodOption4.put("value", "b_minus");
      ObjectNode bloodOption5 = objectMapper.createObjectNode();
      bloodOption5.put("label", "O+");
      bloodOption5.put("value", "o_plus");
      ObjectNode bloodOption6 = objectMapper.createObjectNode();
      bloodOption6.put("label", "O-");
      bloodOption6.put("value", "o_minus");
      bloodOptions.add(bloodOption1);
      bloodOptions.add(bloodOption2);
      bloodOptions.add(bloodOption3);
      bloodOptions.add(bloodOption4);
      bloodOptions.add(bloodOption5);
      bloodOptions.add(bloodOption6);
      medicalField5.set("options", bloodOptions);
      
      ObjectNode medicalField6 = objectMapper.createObjectNode();
      medicalField6.put("type", "checkbox");
      medicalField6.put("label", "Allergies");
      medicalField6.put("required", false);
      medicalField6.put("orderIndex", 1);
      
      ArrayNode allergyOptions = objectMapper.createArrayNode();
      ObjectNode allergyOption1 = objectMapper.createObjectNode();
      allergyOption1.put("label", "Penicillin");
      allergyOption1.put("value", "penicillin");
      ObjectNode allergyOption2 = objectMapper.createObjectNode();
      allergyOption2.put("label", "Latex");
      allergyOption2.put("value", "latex");
      ObjectNode allergyOption3 = objectMapper.createObjectNode();
      allergyOption3.put("label", "Pollen");
      allergyOption3.put("value", "pollen");
      ObjectNode allergyOption4 = objectMapper.createObjectNode();
      allergyOption4.put("label", "Food");
      allergyOption4.put("value", "food");
      allergyOptions.add(allergyOption1);
      allergyOptions.add(allergyOption2);
      allergyOptions.add(allergyOption3);
      allergyOptions.add(allergyOption4);
      medicalField6.set("options", allergyOptions);
      
      ObjectNode medicalField7 = objectMapper.createObjectNode();
      medicalField7.put("type", "textarea");
      medicalField7.put("label", "Current Medications");
      medicalField7.put("required", false);
      medicalField7.put("orderIndex", 2);
      
      ObjectNode medicalField8 = objectMapper.createObjectNode();
      medicalField8.put("type", "textarea");
      medicalField8.put("label", "Medical Conditions");
      medicalField8.put("required", false);
      medicalField8.put("orderIndex", 3);
      
      medicalFields2.add(medicalField5);
      medicalFields2.add(medicalField6);
      medicalFields2.add(medicalField7);
      medicalFields2.add(medicalField8);
      medicalStep2.set("fields", medicalFields2);
      medicalSteps.add(medicalStep2);
      
      medicalConfig.set("steps", medicalSteps);
      
      medicalForm.setConfig(medicalConfig);
      templateRepository.save(medicalForm);
      
      // Create Feedback Survey template
      ObjectNode feedbackConfig = objectMapper.createObjectNode();
      feedbackConfig.put("title", "Customer Feedback");
      feedbackConfig.put("description", "We value your opinion.");
      
      ArrayNode feedbackSteps = objectMapper.createArrayNode();
      ObjectNode feedbackStep = objectMapper.createObjectNode();
      feedbackStep.put("title", "Your Feedback");
      feedbackStep.put("description", "Help us improve our services.");
      
      ArrayNode feedbackFields = objectMapper.createArrayNode();
      ObjectNode feedbackField1 = objectMapper.createObjectNode();
      feedbackField1.put("type", "text");
      feedbackField1.put("label", "Name");
      feedbackField1.put("required", false);
      feedbackField1.put("orderIndex", 0);
      
      ObjectNode feedbackField2 = objectMapper.createObjectNode();
      feedbackField2.put("type", "email");
      feedbackField2.put("label", "Email");
      feedbackField2.put("required", false);
      feedbackField2.put("orderIndex", 1);
      
      ObjectNode feedbackField3 = objectMapper.createObjectNode();
      feedbackField3.put("type", "select");
      feedbackField3.put("label", "Satisfaction Level");
      feedbackField3.put("required", true);
      feedbackField3.put("orderIndex", 2);
      
      ArrayNode satisfactionOptions = objectMapper.createArrayNode();
      ObjectNode satisfactionOption1 = objectMapper.createObjectNode();
      satisfactionOption1.put("label", "Very Satisfied");
      satisfactionOption1.put("value", "very_satisfied");
      ObjectNode satisfactionOption2 = objectMapper.createObjectNode();
      satisfactionOption2.put("label", "Satisfied");
      satisfactionOption2.put("value", "satisfied");
      ObjectNode satisfactionOption3 = objectMapper.createObjectNode();
      satisfactionOption3.put("label", "Neutral");
      satisfactionOption3.put("value", "neutral");
      ObjectNode satisfactionOption4 = objectMapper.createObjectNode();
      satisfactionOption4.put("label", "Unsatisfied");
      satisfactionOption4.put("value", "unsatisfied");
      ObjectNode satisfactionOption5 = objectMapper.createObjectNode();
      satisfactionOption5.put("label", "Very Unsatisfied");
      satisfactionOption5.put("value", "very_unsatisfied");
      satisfactionOptions.add(satisfactionOption1);
      satisfactionOptions.add(satisfactionOption2);
      satisfactionOptions.add(satisfactionOption3);
      satisfactionOptions.add(satisfactionOption4);
      satisfactionOptions.add(satisfactionOption5);
      feedbackField3.set("options", satisfactionOptions);
      
      ObjectNode feedbackField4 = objectMapper.createObjectNode();
      feedbackField4.put("type", "textarea");
      feedbackField4.put("label", "Comments");
      feedbackField4.put("required", false);
      feedbackField4.put("orderIndex", 3);
      
      feedbackFields.add(feedbackField1);
      feedbackFields.add(feedbackField2);
      feedbackFields.add(feedbackField3);
      feedbackFields.add(feedbackField4);
      feedbackStep.set("fields", feedbackFields);
      feedbackSteps.add(feedbackStep);
      feedbackConfig.set("steps", feedbackSteps);
      
      Template feedbackForm = new Template();
      feedbackForm.setName("Customer Feedback");
      feedbackForm.setDescription("Collect customer feedback and suggestions.");
      feedbackForm.setIcon("Mail");
      feedbackForm.setCategory("Business");
      feedbackForm.setConfig(feedbackConfig);
      templateRepository.save(feedbackForm);
      
      // Create Volunteer Application template
      ObjectNode volunteerConfig = objectMapper.createObjectNode();
      volunteerConfig.put("title", "Volunteer Application");
      volunteerConfig.put("description", "Join our volunteer team.");
      
      ArrayNode volunteerSteps = objectMapper.createArrayNode();
      ObjectNode volunteerStep1 = objectMapper.createObjectNode();
      volunteerStep1.put("title", "Personal Information");
      volunteerStep1.put("description", "Tell us about yourself.");
      
      ArrayNode volunteerFields1 = objectMapper.createArrayNode();
      ObjectNode volunteerField1 = objectMapper.createObjectNode();
      volunteerField1.put("type", "text");
      volunteerField1.put("label", "Full Name");
      volunteerField1.put("required", true);
      volunteerField1.put("orderIndex", 0);
      
      ObjectNode volunteerField2 = objectMapper.createObjectNode();
      volunteerField2.put("type", "text");
      volunteerField2.put("label", "Email");
      volunteerField2.put("required", true);
      volunteerField2.put("orderIndex", 1);
      
      ObjectNode volunteerField3 = objectMapper.createObjectNode();
      volunteerField3.put("type", "text");
      volunteerField3.put("label", "Phone");
      volunteerField3.put("required", true);
      volunteerField3.put("orderIndex", 2);
      
      ObjectNode volunteerField4 = objectMapper.createObjectNode();
      volunteerField4.put("type", "date");
      volunteerField4.put("label", "Date of Birth");
      volunteerField4.put("required", true);
      volunteerField4.put("orderIndex", 3);
      
      volunteerFields1.add(volunteerField1);
      volunteerFields1.add(volunteerField2);
      volunteerFields1.add(volunteerField3);
      volunteerFields1.add(volunteerField4);
      volunteerStep1.set("fields", volunteerFields1);
      volunteerSteps.add(volunteerStep1);
      
      ObjectNode volunteerStep2 = objectMapper.createObjectNode();
      volunteerStep2.put("title", "Volunteer Information");
      volunteerStep2.put("description", "How you'd like to help.");
      
      ArrayNode volunteerFields2 = objectMapper.createArrayNode();
      ObjectNode volunteerField5 = objectMapper.createObjectNode();
      volunteerField5.put("type", "select");
      volunteerField5.put("label", "Area of Interest");
      volunteerField5.put("required", true);
      volunteerField5.put("orderIndex", 0);
      
      ArrayNode interestOptions = objectMapper.createArrayNode();
      ObjectNode interestOption1 = objectMapper.createObjectNode();
      interestOption1.put("label", "Education");
      interestOption1.put("value", "education");
      ObjectNode interestOption2 = objectMapper.createObjectNode();
      interestOption2.put("label", "Healthcare");
      interestOption2.put("value", "healthcare");
      ObjectNode interestOption3 = objectMapper.createObjectNode();
      interestOption3.put("label", "Events");
      interestOption3.put("value", "events");
      ObjectNode interestOption4 = objectMapper.createObjectNode();
      interestOption4.put("label", "Administrative");
      interestOption4.put("value", "admin");
      ObjectNode interestOption5 = objectMapper.createObjectNode();
      interestOption5.put("label", "Marketing");
      interestOption5.put("value", "marketing");
      interestOptions.add(interestOption1);
      interestOptions.add(interestOption2);
      interestOptions.add(interestOption3);
      interestOptions.add(interestOption4);
      interestOptions.add(interestOption5);
      volunteerField5.set("options", interestOptions);
      
      ObjectNode volunteerField6 = objectMapper.createObjectNode();
      volunteerField6.put("type", "select");
      volunteerField6.put("label", "Availability");
      volunteerField6.put("required", true);
      volunteerField6.put("orderIndex", 1);
      
      ArrayNode availabilityOptions = objectMapper.createArrayNode();
      ObjectNode availabilityOption1 = objectMapper.createObjectNode();
      availabilityOption1.put("label", "Weekdays");
      availabilityOption1.put("value", "weekdays");
      ObjectNode availabilityOption2 = objectMapper.createObjectNode();
      availabilityOption2.put("label", "Weekends");
      availabilityOption2.put("value", "weekends");
      ObjectNode availabilityOption3 = objectMapper.createObjectNode();
      availabilityOption3.put("label", "Evenings");
      availabilityOption3.put("value", "evenings");
      ObjectNode availabilityOption4 = objectMapper.createObjectNode();
      availabilityOption4.put("label", "Flexible");
      availabilityOption4.put("value", "flexible");
      availabilityOptions.add(availabilityOption1);
      availabilityOptions.add(availabilityOption2);
      availabilityOptions.add(availabilityOption3);
      availabilityOptions.add(availabilityOption4);
      volunteerField6.set("options", availabilityOptions);
      
      ObjectNode volunteerField7 = objectMapper.createObjectNode();
      volunteerField7.put("type", "textarea");
      volunteerField7.put("label", "Previous Experience");
      volunteerField7.put("required", false);
      volunteerField7.put("orderIndex", 2);
      
      ObjectNode volunteerField8 = objectMapper.createObjectNode();
      volunteerField8.put("type", "textarea");
      volunteerField8.put("label", "Why do you want to volunteer?");
      volunteerField8.put("required", true);
      volunteerField8.put("orderIndex", 3);
      
      volunteerFields2.add(volunteerField5);
      volunteerFields2.add(volunteerField6);
      volunteerFields2.add(volunteerField7);
      volunteerFields2.add(volunteerField8);
      volunteerStep2.set("fields", volunteerFields2);
      volunteerSteps.add(volunteerStep2);
      
      volunteerConfig.set("steps", volunteerSteps);
      
      Template volunteerForm = new Template();
      volunteerForm.setName("Volunteer Application");
      volunteerForm.setDescription("Apply to join our volunteer team.");
      volunteerForm.setIcon("Calendar");
      volunteerForm.setCategory("Events");
      volunteerForm.setConfig(volunteerConfig);
      templateRepository.save(volunteerForm);
      
      return "Templates initialized successfully";
    } catch (Exception e) {
      return "Error initializing templates: " + e.getMessage();
    }
  }

  private TemplateDto toDto(Template template) {
    return new TemplateDto(
      template.getId(),
      template.getName(),
      template.getDescription(),
      template.getIcon(),
      template.getCategory(),
      template.getConfig()
    );
  }
}
