import { z } from "zod";

// ১. Power Authority Validation Schema
const createPowerAuthorityZodSchema = z.object({
  body: z.object({
    name: z
      .string({
        message: "Power Authority name is required",
      })
      .min(3, "Name must be at least 3 characters long"),
    code: z
      .string({
        message: "Authority unique code is required",
      })
      .toUpperCase(),
  }),
});

// ২. Distribution Zone Validation Schema
const createZoneZodSchema = z.object({
  body: z.object({
    name: z.string({
      message: "Zone name is required",
    }),
    powerAuthorityId: z
      .string({
        message: "Valid Power Authority ID is required",
      })
      .uuid("Invalid Power Authority ID format"),
  }),
});

// ৩. Substation Validation Schema
const createSubstationZodSchema = z.object({
  body: z.object({
    name: z.string({
      message: "Substation name is required",
    }),
    capacity: z.string().optional(),
    zoneId: z
      .string({
        message: "Valid Distribution Zone ID is required",
      })
      .uuid("Invalid Zone ID format"),
  }),
});

// ৪. Feeder Validation Schema
const createFeederZodSchema = z.object({
  body: z.object({
    name: z.string({
      message: "Feeder line name/number is required",
    }),
    substationId: z
      .string({
        message: "Valid Substation ID is required",
      })
      .uuid("Invalid Substation ID format"),
  }),
});

// ৫. Area Validation Schema
const createAreaZodSchema = z.object({
  body: z.object({
    name: z.string({
      message: "Area name is required",
    }),
    priority: z.enum(["VIP", "HOSPITAL", "NORMAL"], {
      message: "Priority must be VIP, HOSPITAL, or NORMAL",
    }),
    feederId: z
      .string({
        message: "Valid Feeder ID is required",
      })
      .uuid("Invalid Feeder ID format"),
  }),
});

export const GridValidations = {
  createPowerAuthorityZodSchema,
  createZoneZodSchema,
  createSubstationZodSchema,
  createFeederZodSchema,
  createAreaZodSchema,
};
