import { z } from 'zod';
import { 
  insertFormSchema, 
  insertStepSchema, 
  insertFieldSchema, 
  forms, 
  formSteps, 
  formFields, 
  submissions, 
  templates 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  forms: {
    list: {
      method: 'GET' as const,
      path: '/api/forms',
      responses: {
        200: z.array(z.custom<typeof forms.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/forms/:id',
      responses: {
        200: z.custom<typeof forms.$inferSelect & { steps: (typeof formSteps.$inferSelect & { fields: typeof formFields.$inferSelect[] })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/forms',
      input: insertFormSchema,
      responses: {
        201: z.custom<typeof forms.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/forms/:id',
      input: insertFormSchema.partial(),
      responses: {
        200: z.custom<typeof forms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/forms/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    publish: {
      method: 'POST' as const,
      path: '/api/forms/:id/publish',
      responses: {
        200: z.custom<typeof forms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  steps: {
    create: {
      method: 'POST' as const,
      path: '/api/forms/:formId/steps',
      input: insertStepSchema.omit({ formId: true, orderIndex: true }),
      responses: {
        201: z.custom<typeof formSteps.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/steps/:id',
      input: insertStepSchema.partial().omit({ formId: true }),
      responses: {
        200: z.custom<typeof formSteps.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/steps/:id',
      responses: {
        204: z.void(),
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/forms/:formId/steps/reorder',
      input: z.object({
        steps: z.array(z.object({ id: z.number(), orderIndex: z.number() })),
      }),
      responses: {
        200: z.void(),
      },
    },
  },
  fields: {
    create: {
      method: 'POST' as const,
      path: '/api/steps/:stepId/fields',
      input: insertFieldSchema.omit({ stepId: true, orderIndex: true }),
      responses: {
        201: z.custom<typeof formFields.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fields/:id',
      input: insertFieldSchema.partial().omit({ stepId: true }),
      responses: {
        200: z.custom<typeof formFields.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fields/:id',
      responses: {
        204: z.void(),
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/steps/:stepId/fields/reorder',
      input: z.object({
        fields: z.array(z.object({ id: z.number(), orderIndex: z.number() })),
      }),
      responses: {
        200: z.void(),
      },
    },
  },
  submissions: {
    create: {
      method: 'POST' as const,
      path: '/api/forms/:formId/submissions',
      input: z.object({ data: z.record(z.any()) }),
      responses: {
        201: z.custom<typeof submissions.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/forms/:formId/submissions',
      responses: {
        200: z.array(z.custom<typeof submissions.$inferSelect>()),
      },
    },
  },
  ai: {
    generateForm: {
      method: 'POST' as const,
      path: '/api/ai/generate-form',
      input: z.object({ 
        prompt: z.string(),
        model: z.string().optional(),
        complexity: z.enum(['compact', 'balanced', 'detailed']).optional(),
        tone: z.enum(['professional', 'friendly', 'formal']).optional(),
      }),
      responses: {
        200: z.object({
          title: z.string(),
          description: z.string(),
          steps: z.array(z.object({
            title: z.string(),
            description: z.string(),
            fields: z.array(z.object({
              type: z.string(),
              label: z.string(),
              placeholder: z.string().optional(),
              required: z.boolean(),
              options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
            })),
          })),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
