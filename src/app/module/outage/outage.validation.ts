import { z } from "zod";

// ১. 👑 Scheduled Outage Create Validation (বডি অবজেক্ট কেটে ফ্ল্যাট করা হয়েছে)
const createScheduledOutageZodSchema = z.object({
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
});

// ২. 👑 Unexpected Outage Report Validation
const reportUnexpectedOutageZodSchema = z.object({
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
});

// ৩. 👑 Manual Technician Assignment Validation
const assignTechnicianManuallyZodSchema = z.object({
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
});

// 💡 ৪. URL Parameter Validation এর জন্য বিশেষ দ্রষ্টব্য:
// যেহেতু আপনার মিডলওয়্যার শুধুমাত্র req.body চেক করে, তাই URL Params (যেমন: /resolve/:reportId) 
// ভ্যালিডেশনের জন্য মিডলওয়্যারে বডির বদলে req.params পাঠানো লাগবে, অথবা এটি স্কিমা ছাড়াই কন্ট্রোলার লেভেলে হ্যান্ডেল করা সেফ।
const resolveOutageJobZodSchema = z.object({
  reportId: z
    .string({
      message: "Report ID is required in URL parameter",
    })
    .uuid("Invalid Report ID format in URL parameter"),
});

export const OutageValidations = {
  createScheduledOutageZodSchema,
  reportUnexpectedOutageZodSchema,
  assignTechnicianManuallyZodSchema,
  resolveOutageJobZodSchema,
};
