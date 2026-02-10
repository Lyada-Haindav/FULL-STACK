package com.formweaverai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.formweaverai.dto.AiGeneratedFormDto;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GeminiService {
  private static final String DEFAULT_MODEL = "gemini-2.5-flash";
  private final ObjectMapper objectMapper;

  public GeminiService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public AiGeneratedFormDto generateForm(String prompt, String modelOverride, String complexity, String tone) {
    String apiKey = System.getenv("GOOGLE_API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      apiKey = System.getenv("GEMINI_API_KEY");
    }
    if (apiKey == null || apiKey.isBlank()) {
      return fallbackAdvanced(prompt, complexity, tone);
    }

    String systemPrompt = "You are an expert form designer. Produce a multi-step form JSON that is production-ready. " +
      "Rules: " +
      "1) Return ONLY valid JSON. " +
      "2) Always include non-empty strings for title, description, step titles, field labels. " +
      "3) Always include placeholder as a string (empty string allowed). " +
      "4) For select/radio fields, include options array with at least 2 items. " +
      "5) For other field types, options must be an empty array. " +
      "6) Field types must be one of: text, number, select, checkbox, radio, textarea, date. " +
      "7) Use 2-4 steps with 2-6 fields per step when possible. " +
      "Response format: {\"title\":\"Form Title\",\"description\":\"Form Description\",\"steps\":[{\"title\":\"Step Title\",\"description\":\"Step Description\",\"fields\":[{\"type\":\"text\",\"label\":\"Field Label\",\"placeholder\":\"Placeholder\",\"required\":true,\"options\":[{\"label\":\"Option 1\",\"value\":\"opt1\"}]}]}]}";

    String model = modelOverride != null && !modelOverride.isBlank()
      ? modelOverride
      : System.getenv().getOrDefault("GEMINI_MODEL", DEFAULT_MODEL);

    String complexityHint = switch (complexity == null ? "balanced" : complexity) {
      case "compact" -> "Use 1-2 steps with 2-3 fields each.";
      case "detailed" -> "Use 3-4 steps with 4-6 fields each.";
      default -> "Use 2-3 steps with 3-5 fields each.";
    };
    String toneHint = switch (tone == null ? "professional" : tone) {
      case "friendly" -> "Use warm, friendly labels and descriptions.";
      case "formal" -> "Use formal, business-ready language.";
      default -> "Use professional, clear language.";
    };
    String finalPrompt = prompt + "\n\nAdditional guidance: " + complexityHint + " " + toneHint;

    GenerateContentConfig config = GenerateContentConfig.builder()
      .responseMimeType("application/json")
      .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
      .build();

    Client client = Client.builder().apiKey(apiKey).build();
    GenerateContentResponse response = client.models.generateContent(model, finalPrompt, config);
    String text = response.text();

    if (text == null || text.isBlank()) {
      return fallbackAdvanced(prompt, complexity, tone);
    }

    try {
      AiGeneratedFormDto parsed = objectMapper.readValue(text, AiGeneratedFormDto.class);
      AiGeneratedFormDto normalized = normalize(parsed);
      if (isTooSmall(normalized) || looksGeneric(normalized)) {
        AiGeneratedFormDto blueprint = buildBlueprint(prompt, complexity, tone);
        if (blueprint != null) {
          return normalize(blueprint);
        }
        return fallbackAdvanced(prompt, complexity, tone);
      }
      return normalized;
    } catch (Exception e) {
      return fallbackAdvanced(prompt, complexity, tone);
    }
  }

  private AiGeneratedFormDto fallback(String prompt) {
    AiGeneratedFormDto.AiFieldDto field = new AiGeneratedFormDto.AiFieldDto(
      "text",
      "Sample Question",
      "Type your answer",
      true,
      List.of(new AiGeneratedFormDto.OptionDto("Option 1", "option_1"), new AiGeneratedFormDto.OptionDto("Option 2", "option_2"))
    );
    AiGeneratedFormDto.AiStepDto step = new AiGeneratedFormDto.AiStepDto(
      "Step 1",
      "Auto-generated from your prompt.",
      List.of(field)
    );
    return normalize(new AiGeneratedFormDto(
      prompt.length() > 60 ? prompt.substring(0, 60) : prompt,
      "Generated from prompt: " + prompt,
      List.of(step)
    ));
  }

  private AiGeneratedFormDto fallbackAdvanced(String prompt, String complexity, String tone) {
    AiGeneratedFormDto blueprint = buildBlueprint(prompt, complexity, tone);
    if (blueprint != null) {
      return normalize(blueprint);
    }

    String title = prompt == null || prompt.isBlank() ? "Generated Form" : prompt;
    String description = "Generated from prompt: " + prompt;
    String labelStyle = switch (tone == null ? "professional" : tone) {
      case "friendly" -> "Please share";
      case "formal" -> "Kindly provide";
      default -> "Provide";
    };

    List<AiGeneratedFormDto.AiStepDto> steps = new java.util.ArrayList<>();
    String p = prompt == null ? "" : prompt.toLowerCase();

    if (p.contains("screen") || p.contains("qualification")) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Screening",
        "Initial qualification questions.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("select", labelStyle + " your eligibility status", "", true,
            List.of(new AiGeneratedFormDto.OptionDto("Eligible", "eligible"), new AiGeneratedFormDto.OptionDto("Not sure", "unsure"))),
          new AiGeneratedFormDto.AiFieldDto("checkbox", labelStyle + " confirmation of requirements", "", true, List.of())
        )
      ));
    }
    if (p.contains("experience") || p.contains("resume")) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Experience",
        "Tell us about your background.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("textarea", labelStyle + " your recent experience", "", true, List.of()),
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " your primary role", "", true, List.of())
        )
      ));
    }
    if (p.contains("reference")) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "References",
        "Provide professional references.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " reference name", "", true, List.of()),
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " reference email", "", true, List.of())
        )
      ));
    }
    if (p.contains("availability") || p.contains("schedule")) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Availability",
        "Confirm your preferred schedule.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("select", labelStyle + " preferred start date", "", false,
            List.of(new AiGeneratedFormDto.OptionDto("Immediate", "immediate"), new AiGeneratedFormDto.OptionDto("2-4 weeks", "2-4w"))),
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " time zone", "", false, List.of())
        )
      ));
    }

    if (steps.isEmpty()) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Basics",
        "Start with the essentials.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " your name", "", true, List.of()),
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " your email", "", true, List.of())
        )
      ));
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Details",
        "Add the key details.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("textarea", labelStyle + " more context", "", false, List.of()),
          new AiGeneratedFormDto.AiFieldDto("select", labelStyle + " priority level", "", false,
            List.of(new AiGeneratedFormDto.OptionDto("High", "high"), new AiGeneratedFormDto.OptionDto("Normal", "normal")))
        )
      ));
    }

    if ("detailed".equals(complexity) && steps.size() < 3) {
      steps.add(new AiGeneratedFormDto.AiStepDto(
        "Additional Info",
        "Optional details to help us personalize.",
        List.of(
          new AiGeneratedFormDto.AiFieldDto("textarea", labelStyle + " any extra notes", "", false, List.of()),
          new AiGeneratedFormDto.AiFieldDto("text", labelStyle + " preferred contact method", "", false, List.of())
        )
      ));
    }

    if ("compact".equals(complexity) && steps.size() > 2) {
      steps = steps.subList(0, 2);
    }

    return normalize(new AiGeneratedFormDto(title, description, steps));
  }

  private AiGeneratedFormDto normalize(AiGeneratedFormDto input) {
    if (input == null) {
      return fallback("Generated Form");
    }
    List<String> allowedTypes = List.of("text", "number", "select", "checkbox", "radio", "textarea", "date");
    List<AiGeneratedFormDto.AiStepDto> steps = input.steps() == null ? List.of() : input.steps().stream()
      .map(step -> {
        String stepTitle = (step.title() == null || step.title().isBlank()) ? "Step" : step.title();
        String stepDescription = step.description() == null ? "" : step.description();
        List<AiGeneratedFormDto.AiFieldDto> fields = step.fields() == null ? List.of() : step.fields().stream()
          .map(field -> {
            String type = field.type() == null ? "text" : field.type().toLowerCase();
            if (!allowedTypes.contains(type)) {
              type = "text";
            }
            String label = (field.label() == null || field.label().isBlank()) ? "Field" : field.label();
            String placeholder = field.placeholder() == null ? "" : field.placeholder();
            List<AiGeneratedFormDto.OptionDto> options = field.options() == null ? List.of() : field.options();
            boolean needsOptions = type.equals("select") || type.equals("radio");
            if (needsOptions && options.isEmpty()) {
              options = List.of(
                new AiGeneratedFormDto.OptionDto("Option 1", "option_1"),
                new AiGeneratedFormDto.OptionDto("Option 2", "option_2")
              );
            }
            if (!needsOptions) {
              options = List.of();
            }
            return new AiGeneratedFormDto.AiFieldDto(
              type,
              label,
              placeholder,
              field.required(),
              options
            );
          })
          .toList();
        return new AiGeneratedFormDto.AiStepDto(stepTitle, stepDescription, fields);
      })
      .toList();

    String title = (input.title() == null || input.title().isBlank()) ? "Generated Form" : input.title();
    String description = input.description() == null ? "" : input.description();
    return new AiGeneratedFormDto(title, description, steps);
  }

  private boolean isTooSmall(AiGeneratedFormDto form) {
    if (form == null || form.steps() == null) {
      return true;
    }
    if (form.steps().size() < 2) {
      return true;
    }
    int fieldCount = form.steps().stream()
      .mapToInt(step -> step.fields() == null ? 0 : step.fields().size())
      .sum();
    return fieldCount < 4;
  }

  private boolean looksGeneric(AiGeneratedFormDto form) {
    if (form == null || form.steps() == null || form.steps().isEmpty()) {
      return true;
    }
    List<String> genericSteps = List.of("step 1", "step 2", "step 3", "basics", "details", "additional info", "additional information");
    List<String> genericFields = List.of("field", "sample question", "question", "new field");
    int genericStepCount = 0;
    int genericFieldCount = 0;
    int totalFieldCount = 0;

    for (AiGeneratedFormDto.AiStepDto step : form.steps()) {
      String title = step.title() == null ? "" : step.title().trim().toLowerCase();
      if (genericSteps.contains(title)) {
        genericStepCount++;
      }
      if (step.fields() == null) {
        continue;
      }
      for (AiGeneratedFormDto.AiFieldDto field : step.fields()) {
        totalFieldCount++;
        String label = field.label() == null ? "" : field.label().trim().toLowerCase();
        if (genericFields.contains(label)) {
          genericFieldCount++;
        }
      }
    }

    if (genericStepCount >= Math.max(1, form.steps().size() / 2)) {
      return true;
    }
    if (totalFieldCount > 0 && genericFieldCount >= Math.max(1, totalFieldCount / 2)) {
      return true;
    }
    return false;
  }

  private AiGeneratedFormDto buildBlueprint(String prompt, String complexity, String tone) {
    String p = prompt == null ? "" : prompt.toLowerCase();
    String labelStyle = switch (tone == null ? "professional" : tone) {
      case "friendly" -> "Please share";
      case "formal" -> "Kindly provide";
      default -> "Provide";
    };
    String title = prompt == null || prompt.isBlank() ? "Generated Form" : prompt;
    String description = "Generated from prompt: " + (prompt == null ? "" : prompt);

    if (p.contains("blood") && (p.contains("donation") || p.contains("donor"))) {
      return new AiGeneratedFormDto(
        "Blood Donation Intake",
        "Screen donors and collect eligibility details before scheduling.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Eligibility",
            "Confirm eligibility basics.",
            List.of(
              field("number", "Age", "e.g. 24", true),
              field("number", "Weight (kg)", "e.g. 65", true),
              field("select", "Have you donated blood in the last 8 weeks?", "", true,
                List.of(option("Yes", "yes"), option("No", "no"))),
              field("select", "Are you feeling healthy today?", "", true,
                List.of(option("Yes", "yes"), option("No", "no")))
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Health History",
            "Help us ensure a safe donation.",
            List.of(
              field("checkbox", "Do you have any current medications?", "", false),
              field("textarea", "List any chronic conditions or allergies", "", false),
              field("select", "Have you had a recent vaccination?", "", false,
                List.of(option("No", "no"), option("Within 2 weeks", "2w"), option("More than 2 weeks ago", "more_2w")))
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Donation Details",
            "Plan your donation.",
            List.of(
              field("select", "Blood type (if known)", "", false,
                List.of(option("A+", "a_pos"), option("A-", "a_neg"), option("B+", "b_pos"), option("B-", "b_neg"),
                  option("AB+", "ab_pos"), option("AB-", "ab_neg"), option("O+", "o_pos"), option("O-", "o_neg"))),
              field("date", "Preferred donation date", "", true),
              field("select", "Preferred time slot", "", true,
                List.of(option("Morning", "morning"), option("Afternoon", "afternoon"), option("Evening", "evening")))
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Contact & Consent",
            "We will confirm your appointment.",
            List.of(
              field("text", labelStyle + " your full name", "", true),
              field("text", labelStyle + " your email", "", true),
              field("text", "Phone number", "", true),
              field("checkbox", "I confirm the above information is accurate.", "", true)
            )
          )
        )
      );
    }

    if (p.contains("job") || p.contains("application") || p.contains("resume") || p.contains("candidate")) {
      return new AiGeneratedFormDto(
        "Job Application",
        "Collect candidate details, experience, and availability.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Personal Details",
            "Basic contact information.",
            List.of(
              field("text", "Full name", "", true),
              field("text", "Email", "", true),
              field("text", "Phone number", "", true),
              field("text", "Current location", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Experience",
            "Professional background.",
            List.of(
              field("textarea", "Summary of relevant experience", "", true),
              field("text", "Primary role/title", "", true),
              field("text", "LinkedIn or portfolio URL", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Availability",
            "Logistics and expectations.",
            List.of(
              field("select", "Notice period", "", true,
                List.of(option("Immediate", "immediate"), option("2 weeks", "2w"), option("1 month", "1m"), option("Other", "other"))),
              field("select", "Preferred work model", "", false,
                List.of(option("On-site", "onsite"), option("Hybrid", "hybrid"), option("Remote", "remote"))),
              field("text", "Salary expectations", "", false)
            )
          )
        )
      );
    }

    if (p.contains("event") || p.contains("registration") || p.contains("conference") || p.contains("webinar")) {
      return new AiGeneratedFormDto(
        "Event Registration",
        "Register attendees and capture preferences.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Attendee Info",
            "Who is attending?",
            List.of(
              field("text", "Full name", "", true),
              field("text", "Email", "", true),
              field("text", "Organization", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Ticket & Preferences",
            "Choose your ticket and preferences.",
            List.of(
              field("select", "Ticket type", "", true,
                List.of(option("General Admission", "general"), option("VIP", "vip"), option("Student", "student"))),
              field("select", "Session interest", "", false,
                List.of(option("Keynote", "keynote"), option("Workshop", "workshop"), option("Networking", "networking"))),
              field("checkbox", "I want to receive event updates", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Logistics",
            "Help us plan your experience.",
            List.of(
              field("select", "Dietary preference", "", false,
                List.of(option("None", "none"), option("Vegetarian", "veg"), option("Vegan", "vegan"), option("Halal", "halal"))),
              field("textarea", "Accessibility needs", "", false),
              field("text", "Emergency contact", "", false)
            )
          )
        )
      );
    }

    if (p.contains("feedback") || p.contains("survey") || p.contains("satisfaction") || p.contains("nps")) {
      return new AiGeneratedFormDto(
        "Customer Feedback",
        "Gather structured feedback and improvement ideas.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Experience",
            "Tell us how it went.",
            List.of(
              field("select", "Overall satisfaction", "", true,
                List.of(option("Excellent", "excellent"), option("Good", "good"), option("Okay", "ok"), option("Poor", "poor"))),
              field("number", "Likelihood to recommend (0-10)", "0-10", true),
              field("textarea", "What worked well?", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Improvements",
            "Help us improve.",
            List.of(
              field("textarea", "What should we improve?", "", false),
              field("select", "Most important improvement area", "", false,
                List.of(option("Quality", "quality"), option("Speed", "speed"), option("Support", "support"), option("Pricing", "pricing"))),
              field("checkbox", "May we contact you for follow-up?", "", false)
            )
          )
        )
      );
    }

    if (p.contains("medical") || p.contains("clinic") || p.contains("patient") || p.contains("intake")) {
      return new AiGeneratedFormDto(
        "Patient Intake",
        "Collect patient history and appointment details.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Patient Details",
            "Basic information.",
            List.of(
              field("text", "Full name", "", true),
              field("date", "Date of birth", "", true),
              field("text", "Phone number", "", true),
              field("text", "Email", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Health History",
            "Background and symptoms.",
            List.of(
              field("textarea", "Primary reason for visit", "", true),
              field("textarea", "Current medications", "", false),
              field("select", "Do you have allergies?", "", false,
                List.of(option("No", "no"), option("Yes", "yes")))
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Appointment",
            "Schedule and preferences.",
            List.of(
              field("date", "Preferred appointment date", "", true),
              field("select", "Preferred time", "", true,
                List.of(option("Morning", "morning"), option("Afternoon", "afternoon"), option("Evening", "evening"))),
              field("text", "Insurance provider", "", false)
            )
          )
        )
      );
    }

    if (p.contains("bug") || p.contains("issue") || p.contains("support") || p.contains("ticket")) {
      return new AiGeneratedFormDto(
        "Support Ticket",
        "Capture issue details for faster resolution.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Reporter",
            "Contact details.",
            List.of(
              field("text", "Name", "", true),
              field("text", "Email", "", true),
              field("text", "Company", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Issue Details",
            "Describe the problem.",
            List.of(
              field("text", "Product or module", "", true),
              field("select", "Severity", "", true,
                List.of(option("Critical", "critical"), option("High", "high"), option("Medium", "medium"), option("Low", "low"))),
              field("textarea", "Steps to reproduce", "", true),
              field("textarea", "Expected vs actual behavior", "", false)
            )
          )
        )
      );
    }

    if (p.contains("course") || p.contains("training") || p.contains("student")) {
      return new AiGeneratedFormDto(
        "Course Registration",
        "Enroll students and capture learning goals.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Student Info",
            "Who is registering?",
            List.of(
              field("text", "Full name", "", true),
              field("text", "Email", "", true),
              field("text", "Phone", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Course Details",
            "Pick the course and format.",
            List.of(
              field("select", "Course track", "", true,
                List.of(option("Beginner", "beginner"), option("Intermediate", "intermediate"), option("Advanced", "advanced"))),
              field("select", "Preferred schedule", "", false,
                List.of(option("Weekdays", "weekdays"), option("Weekends", "weekends"), option("Evenings", "evenings"))),
              field("textarea", "Learning goals", "", false)
            )
          )
        )
      );
    }

    if (p.contains("rental") || p.contains("lease") || p.contains("apartment") || p.contains("tenant")) {
      return new AiGeneratedFormDto(
        "Rental Application",
        "Collect applicant details and rental history.",
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Applicant Details",
            "Basic information.",
            List.of(
              field("text", "Full name", "", true),
              field("text", "Email", "", true),
              field("text", "Phone number", "", true),
              field("text", "Current address", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Employment",
            "Income and employment.",
            List.of(
              field("text", "Employer name", "", true),
              field("text", "Job title", "", false),
              field("number", "Monthly income", "", true)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Rental History",
            "Past rental details.",
            List.of(
              field("text", "Previous landlord name", "", false),
              field("text", "Landlord contact", "", false),
              field("textarea", "Reason for moving", "", false)
            )
          )
        )
      );
    }

    if ("detailed".equals(complexity)) {
      return new AiGeneratedFormDto(
        title,
        description,
        List.of(
          new AiGeneratedFormDto.AiStepDto(
            "Basics",
            "Start with essentials.",
            List.of(
              field("text", labelStyle + " your full name", "", true),
              field("text", labelStyle + " your email", "", true),
              field("text", "Phone number", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Details",
            "Add key details.",
            List.of(
              field("textarea", labelStyle + " more context", "", false),
              field("select", labelStyle + " priority level", "", false,
                List.of(option("High", "high"), option("Normal", "normal"), option("Low", "low"))),
              field("text", "Preferred contact method", "", false)
            )
          ),
          new AiGeneratedFormDto.AiStepDto(
            "Additional Info",
            "Optional details to help us personalize.",
            List.of(
              field("textarea", labelStyle + " any extra notes", "", false),
              field("checkbox", "I agree to be contacted with updates.", "", false)
            )
          )
        )
      );
    }

    return null;
  }

  private AiGeneratedFormDto.AiFieldDto field(String type, String label, String placeholder, boolean required) {
    return new AiGeneratedFormDto.AiFieldDto(type, label, placeholder == null ? "" : placeholder, required, List.of());
  }

  private AiGeneratedFormDto.AiFieldDto field(String type, String label, String placeholder, boolean required, List<AiGeneratedFormDto.OptionDto> options) {
    return new AiGeneratedFormDto.AiFieldDto(type, label, placeholder == null ? "" : placeholder, required, options == null ? List.of() : options);
  }

  private AiGeneratedFormDto.OptionDto option(String label, String value) {
    return new AiGeneratedFormDto.OptionDto(label, value);
  }
}
