import { z } from "zod";

// ১. Scheduled Outage Create Validation
const createScheduledOutageZodSchema = z.object({
  body: z.object({
    feederId: z
      .string({
        message: "Valid Feeder ID is required",
      })
      .uuid("Invalid Feeder ID format"),
    startTime: z.string({
      message: "Start time is required (e.g., ISO string or HH:MM)",
    }),
    endTime: z.string({
      message: "End time is required",
    }),
  }),
});

// ২. Unexpected Outage Report Validation (Customer Complaint)
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

// ৩. Technician Job Resolve Validation (Route Params Validation)
const resolveOutageJobZodSchema = z.object({
  params: z.object({
    reportId: z
      .string({
        message: "Report ID is required in URL parameter",
      })
      .uuid("Invalid Report ID format in URL parameter"),
  }),
});

// ৪. Manual Technician Assignment Validation
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
