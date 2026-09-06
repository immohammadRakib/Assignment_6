import { z } from "zod";

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
