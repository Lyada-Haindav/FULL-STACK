import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Linked to auth.users.id
  title: text("title").notNull(),
  description: text("description"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const formSteps = pgTable("form_steps", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
});

export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  stepId: integer("step_id").notNull().references(() => formSteps.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, number, select, radio, date, etc.
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  defaultValue: text("default_value"),
  required: boolean("required").default(false).notNull(),
  orderIndex: integer("order_index").notNull(),
  options: jsonb("options").$type<{ label: string; value: string }[]>(), // For select/radio
  validationRules: jsonb("validation_rules"), // e.g. min, max, regex
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(), // The actual answers
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  category: text("category").notNull(),
  config: jsonb("config").notNull(), // Full structure for cloning
});

// === RELATIONS ===

export const formsRelations = relations(forms, ({ many }) => ({
  steps: many(formSteps),
  submissions: many(submissions),
}));

export const stepsRelations = relations(formSteps, ({ one, many }) => ({
  form: one(forms, {
    fields: [formSteps.formId],
    references: [forms.id],
  }),
  fields: many(formFields),
}));

export const fieldsRelations = relations(formFields, ({ one }) => ({
  step: one(formSteps, {
    fields: [formFields.stepId],
    references: [formSteps.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  form: one(forms, {
    fields: [submissions.formId],
    references: [forms.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertFormSchema = createInsertSchema(forms).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertStepSchema = createInsertSchema(formSteps).omit({ 
  id: true 
});

export const insertFieldSchema = createInsertSchema(formFields).omit({ 
  id: true 
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true
});

// === EXPLICIT API CONTRACT TYPES ===

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type Step = typeof formSteps.$inferSelect;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type Field = typeof formFields.$inferSelect;
export type InsertField = z.infer<typeof insertFieldSchema>;
export type Submission = typeof submissions.$inferSelect;
export type Template = typeof templates.$inferSelect;

export type FormWithStepsAndFields = Form & {
  steps: (Step & {
    fields: Field[];
  })[];
};

export type CreateFormRequest = InsertForm;
export type UpdateFormRequest = Partial<InsertForm>;

export type CreateStepRequest = InsertStep;
export type UpdateStepRequest = Partial<InsertStep>;

export type CreateFieldRequest = InsertField;
export type UpdateFieldRequest = Partial<InsertField>;

export type SubmitFormRequest = {
  data: Record<string, any>;
};

export type GenerateFormRequest = {
  prompt: string;
  model?: string;
  complexity?: "compact" | "balanced" | "detailed";
  tone?: "professional" | "friendly" | "formal";
};

export type AIGeneratedForm = {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    fields: {
      type: string;
      label: string;
      placeholder?: string;
      required: boolean;
      options?: { label: string; value: string }[];
    }[];
  }[];
};
