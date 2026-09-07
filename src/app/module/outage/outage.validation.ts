import { z } from "zod";

const createScheduledOutageZodSchema = z.object({
  body: z.object({
    areaId: z
      .string({
        message: "Valid Area ID is required",
      })
      .uuid("Invalid Area ID format"),
    startTime: z
      .string({
        message: "Start time is required (ISO string format)",
      })
      .datetime({
        message: "Start time must be a valid ISO 8601 date-time string",
      }),
    endTime: z
      .string({
        message: "End time is required (ISO string format)",
      })
      .datetime({
        message: "End time must be a valid ISO 8601 date-time string",
      }),
    reason: z
      .string()
      .min(5, "Reason must be at least 5 characters long")
      .optional(),
  }),
});

const reportUnexpectedOutageZodSchema = z.object({
  body: z.object({
    customerId: z
      .string({
        message: "Customer ID must be a valid string",
      })
      .uuid("Invalid Customer ID format")
      .optional(),
    areaId: z
      .string({
        message: "Area ID must be a valid string",
      })
      .uuid("Invalid Area ID format")
      .optional(),
    description: z
      .string({
        message: "Description is required",
      })
      .min(5, "Description must be at least 5 characters long"),
  }),
});

const resolveOutageJobZodSchema = z.object({
  params: z.object({
    reportId: z
      .string({
        message: "Report ID is required in URL parameter",
      })
      .uuid("Invalid Report ID format in URL parameter"),
  }),
});

const assignTechnicianManuallyZodSchema = z.object({
  body: z.object({
    reportId: z
      .string({
        message: "Report ID is required",
      })
      .uuid("Invalid Report ID format"),
    technicianId: z
      .string({
        message: "Technician ID is required",
      })
      .uuid("Invalid Technician ID format"),
  }),
});

export const OutageValidations = {
  createScheduledOutageZodSchema,
  reportUnexpectedOutageZodSchema,
  resolveOutageJobZodSchema,
  assignTechnicianManuallyZodSchema,
};
