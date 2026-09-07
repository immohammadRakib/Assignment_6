import { prisma } from "../../lib/prisma"; 
import {
  OutageStatus,
  OutageType,
  TechnicianStatus,
} from "../../../generated/prisma/enums";
import {
  IReportOutagePayload,
  IOutageResponse,
  IScheduledOutagePayload,
  IOutageResolveResponse,
  ITechnicianFilterableFields,
  IManualAssignmentResponse,
  IOutageReportFilterableFields,
} from "./outage.interface";
import { paginationHelper } from "../../utils/paginationHelper";
import { Prisma } from "../../../generated/prisma/browser";

const createScheduledOutageInDB = async (payload: IScheduledOutagePayload) => {
  const { areaId, startTime, endTime, reason } = payload;

  const result = await prisma.outage.create({
    data: {
      areaId,
      type: OutageType.SCHEDULED,
      status: OutageStatus.PLANNED,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason: reason || "Regular Load Shedding Management",
    },
    include: {
      area: { select: { name: true } },
    },
  });

  return result;
};

// const getAllScheduledOutagesFromDB = async (query: any) => {
//   const { areaId, status } = query;

//   const andConditions: any[] = [{ type: OutageType.SCHEDULED }];

//   if (areaId) {
//     andConditions.push({ areaId: areaId as string });
//   }

//   if (status) {
//     andConditions.push({ status: status as OutageStatus });
//   }

//   const whereConditions =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const result = await prisma.outage.findMany({
//     where: whereConditions,
//     include: {
//       area: {
//         select: {
//           name: true,
//           feeder: { select: { name: true } },
//         },
//       },
//     },
//     orderBy: { startTime: "asc" },
//   });

//   return result;
// };


const getAllScheduledOutagesFromDB = async (query: any) => {
  const { areaId, status, searchTerm, ...paginationOptions } = query;

  const { page, limit, skip, sortBy, sortOrder } = 
    paginationHelper.calculatePagination(paginationOptions);

  const andConditions: Prisma.OutageWhereInput[] = [
    { type: OutageType.SCHEDULED },
    { isDeleted: false }
  ];

  if (areaId) {
    andConditions.push({ areaId: areaId as string });
  }

  if (status) {
    andConditions.push({ status: status as OutageStatus });
  }

  if (searchTerm) {
    andConditions.push({
      area: {
        name: { contains: searchTerm as string, mode: "insensitive" }
      }
    });
  }

  const whereConditions: Prisma.OutageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const sortConditions: any = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  } else {
    sortConditions["startTime"] = "asc"; 
  }

  const data = await prisma.outage.findMany({
    where: whereConditions,
    skip: Number(skip),
    take: Number(limit),
    orderBy: sortConditions,
    include: {
      area: {
        select: {
          name: true,
          feeder: { select: { name: true } },
        },
      },
    },
  });

  const total = await prisma.outage.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};


// const reportUnexpectedOutage = async (payload: any): Promise<any> => {
//   const { customerId, areaId, description } = payload;

//   const existingActiveOutage = await prisma.outage.findFirst({
//     where: {
//       areaId,
//       type: OutageType.UNEXPECTED,
//       status: {
//         in: [
//           OutageStatus.PENDING,
//           OutageStatus.ACTIVE,
//           OutageStatus.ASSIGNED,
//           OutageStatus.REPAIRING,
//         ],
//       },
//     },
//   });

//   if (existingActiveOutage) {
//     const newReport = await prisma.outageReport.create({
//       data: {
//         customerId,
//         description: description || "Reported same outage by another customer.",
//         status: OutageStatus.PENDING,
//       },
//     });

//     return {
//       message:
//         "This outage is already acknowledged by the system. Your report has been logged.",
//       outage: existingActiveOutage,
//       report: newReport,
//     };
//   }

//   return await prisma.$transaction(async (tx) => {
//     const newOutage = await tx.outage.create({
//       data: {
//         areaId,
//         type: OutageType.UNEXPECTED,
//         status: OutageStatus.PENDING,
//         reason: "Unexpected Grid/Transformer Breakdown",
//         startTime: new Date(),
//         endTime: new Date(Date.now() + 60 * 60 * 1000),
//       },
//     });

//     const targetArea = await tx.area.findUnique({
//       where: { id: areaId },
//       include: {
//         feeder: {
//           include: {
//             substation: {
//               select: { zoneId: true },
//             },
//           },
//         },
//       },
//     });

//     const zoneId = targetArea?.feeder?.substation?.zoneId;
//     let assignedTechId = null;
//     let ticketStatus: OutageStatus = OutageStatus.PENDING;

//     if (zoneId) {
//       const availableTech = await tx.technician.findFirst({
//         where: {
//           zoneId,
//           status: TechnicianStatus.AVAILABLE,
//         },
//       });

//       if (availableTech) {
//         assignedTechId = availableTech.id;
//         ticketStatus = OutageStatus.ASSIGNED;

//         await tx.technician.update({
//           where: { id: availableTech.id },
//           data: { status: TechnicianStatus.ON_DUTY },
//         });

//         await tx.outage.update({
//           where: { id: newOutage.id },
//           data: { status: OutageStatus.ASSIGNED },
//         });
//       }
//     }

//     const customerReport = await tx.outageReport.create({
//       data: {
//         customerId,
//         description:
//           description || "Power Outage/Transformer Breakdown Reported.",
//         status: ticketStatus,
//         technicianId: assignedTechId,
//       },
//     });

//     if (!assignedTechId) {
//       await tx.outage.update({
//         where: { id: newOutage.id },
//         data: { status: OutageStatus.ACTIVE },
//       });
//     }

//     return {
//       success: true,
//       message: assignedTechId
//         ? "Emergency Outage registered and technician successfully auto-dispatched!"
//         : "Outage registered. No free technician in this zone, queued for manual dispatch.",
//       outage: newOutage,
//       report: customerReport,
//     };
//   });
// };

// const resolveOutageJob = async (reportId: string): Promise<any> => {
//   return await prisma.$transaction(async (tx) => {
//     const report = await tx.outageReport.findUnique({
//       where: { id: reportId },
//     });

//     if (!report) {
//       throw new Error("Complaint report ticket not found!");
//     }

//     if (report.status === OutageStatus.RESTORED) {
//       throw new Error("This job is already resolved!");
//     }

//     const updatedReport = await tx.outageReport.update({
//       where: { id: reportId },
//       data: {
//         status: OutageStatus.RESTORED,
//       },
//     });

//     if (report.technicianId) {
//       await tx.technician.update({
//         where: { id: report.technicianId },
//         data: {
//           status: TechnicianStatus.AVAILABLE,
//         },
//       });
//     }

//     if ((report as any).outageId) {
//       await tx.outage.update({
//         where: { id: (report as any).outageId },
//         data: {
//           status: OutageStatus.RESTORED,
//           endTime: new Date(),
//         },
//       });
//     }

//     return {
//       success: true,
//       message:
//         " Power Restored successfully! Job resolved directly via report ticket.",
//       report: updatedReport,
//     };
//   });
// };

const reportUnexpectedOutage = async (payload: any): Promise<any> => {
  const { customerId, areaId, description } = payload;

  // 💡 ১. ডাটাবেজে এই কাস্টমার আসলেই আছে কি না তা আগে নিশ্চিত হওয়া
  // যদি আপনার ফ্রন্টএন্ড/পোস্টম্যান থেকে 'userId' পাঠানো হয়ে থাকে, তবে এখানে userId দিয়ে খুঁজুন
  let customer = await prisma.customer.findUnique({
    where: { id: customerId }, // অথবা where: { userId: customerId } যদি userId পাঠানো হয়
  });

  // যদি প্রাইমারি আইডি দিয়ে না পাওয়া যায়, তবে userId দিয়েও একবার চেক করে ব্যাকআপ নেওয়া
  if (!customer) {
    customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });
  }

  // যদি কোনোভাবেই কাস্টমার না পাওয়া যায়, তবে ফরেন কি এরর দেওয়ার আগেই সুন্দর মেসেজ থ্রো করা
  if (!customer) {
    throw new Error("❌ Invalid Customer! No customer profile found with the provided ID.");
  }

  // 💡 এখন আমরা নিশ্চিত ডাটাবেজের আসল কাস্টমার আইডি আমাদের হাতে আছে (customer.id)
  const actualCustomerId = customer.id;

  const existingActiveOutage = await prisma.outage.findFirst({
    where: {
      areaId,
      type: OutageType.UNEXPECTED,
      status: {
        in: [
          OutageStatus.PENDING,
          OutageStatus.ACTIVE,
          OutageStatus.ASSIGNED,
          OutageStatus.REPAIRING,
        ],
      },
    },
  });

  if (existingActiveOutage) {
    const newReport = await prisma.outageReport.create({
      data: {
        customerId: actualCustomerId, // 👈 আসল আইডি ব্যবহার করা হলো
        description: description || "Reported same outage by another customer.",
        status: OutageStatus.PENDING,
      },
    });

    return {
      message:
        "This outage is already acknowledged by the system. Your report has been logged.",
      outage: existingActiveOutage,
      report: newReport,
    };
  }

  return await prisma.$transaction(async (tx) => {
    const newOutage = await tx.outage.create({
      data: {
        areaId,
        type: OutageType.UNEXPECTED,
        status: OutageStatus.PENDING,
        reason: "Unexpected Grid/Transformer Breakdown",
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const targetArea = await tx.area.findUnique({
      where: { id: areaId },
      include: {
        feeder: {
          include: {
            substation: {
              select: { zoneId: true },
            },
          },
        },
      },
    });

    const zoneId = targetArea?.feeder?.substation?.zoneId;
    let assignedTechId = null;
    let ticketStatus: OutageStatus = OutageStatus.PENDING;

    if (zoneId) {
      const availableTech = await tx.technician.findFirst({
        where: {
          zoneId,
          status: TechnicianStatus.AVAILABLE,
        },
      });

      if (availableTech) {
        assignedTechId = availableTech.id;
        ticketStatus = OutageStatus.ASSIGNED;

        await tx.technician.update({
          where: { id: availableTech.id },
          data: { status: TechnicianStatus.ON_DUTY },
        });

        await tx.outage.update({
          where: { id: newOutage.id },
          data: { status: OutageStatus.ASSIGNED },
        });
      }
    }

    const customerReport = await tx.outageReport.create({
      data: {
        customerId: actualCustomerId, // 👈 আসল আইডি ব্যবহার করা হলো
        description:
          description || "Power Outage/Transformer Breakdown Reported.",
        status: ticketStatus,
        technicianId: assignedTechId,
      },
    });

    if (!assignedTechId) {
      await tx.outage.update({
        where: { id: newOutage.id },
        data: { status: OutageStatus.ACTIVE },
      });
    }

    return {
      success: true,
      message: assignedTechId
        ? "Emergency Outage registered and technician successfully auto-dispatched!"
        : "Outage registered. No free technician in this zone, queued for manual dispatch.",
      outage: newOutage,
      report: customerReport,
    };
  });
};


const resolveOutageJob = async (reportId: string, payload: { notes?: string }): Promise<IOutageResolveResponse> => {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.outageReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Complaint report ticket not found!");
    }

    if (report.status === OutageStatus.RESTORED) {
      throw new Error("This job is already resolved!");
    }

    // ৩. আউটেজ রিপোর্টের স্ট্যাটাস RESTORED করা
    // const updatedReport = await tx.outageReport.update({
    //   where: { id: reportId },
    //   data: {
    //     status: OutageStatus.RESTORED,
    //   },
    // });

      const updatedReport = await tx.outageReport.update({
      where: { id: reportId },
      data: {
        status: OutageStatus.RESTORED, // আপনার স্কিমা অনুযায়ী
        notes: payload.notes || "Resolved successfully by the technical team.", // 👈 এই লাইনটি চেক করুন
      },
    });

    // ৪. 👑 অটো-সেটআপ: টেকনিশিয়ানকে ফ্রি (AVAILABLE) করা
    if (report.technicianId) {
      await tx.technician.update({
        where: { id: report.technicianId },
        data: {
          status: TechnicianStatus.AVAILABLE,
        },
      });
    }

    // ৫. ⚡ টাইপ সেফ ওয়েতে মেইন Outage টেবিলের স্ট্যাটাস ও টাইম ট্র্যাক করা
    // আপনার প্রিজমা স্কিমা অনুযায়ী যদি ফিল্ডটির নাম 'outageId' হয়ে থাকে:
    if ('outageId' in report && (report as any).outageId) {
      await tx.outage.update({
        where: { id: (report as any).outageId },
        data: {
          status: OutageStatus.RESTORED,
          endTime: new Date(), // মডার্ন ডাটা প্র্যাকটিস অনুযায়ী কখন শেষ হলো তা সেভ করা
        },
      });
    }

    return {
      success: true,
      message: "⚡ Power Restored successfully! Job resolved directly via report ticket.",
      report: updatedReport,
    };
  });
};





const getActiveOutageByArea = async (areaId: string) => {
  const result = await prisma.outage.findFirst({
    where: {
      areaId,
      status: {
        in: [
          OutageStatus.PLANNED,
          OutageStatus.ACTIVE,
          OutageStatus.ASSIGNED,
          OutageStatus.REPAIRING,
        ],
      },
    },
    include: {
      area: {
        select: {
          name: true,
          priority: true,
        },
      },
    },
  });

  return result;
};

// const assignTechnicianManually = async (
//   reportId: string,
//   technicianId: string,
// ) => {
//   return await prisma.$transaction(async (tx) => {
//     const technician = await tx.technician.findUnique({
//       where: { id: technicianId },
//     });

//     if (!technician) {
//       throw new Error("Selected Technician profile not found!");
//     }

//     if (technician.status !== TechnicianStatus.AVAILABLE) {
//       throw new Error(
//         "This technician is currently ON_DUTY or OFFLINE. Cannot assign!",
//       );
//     }

//     const updatedReport = await tx.outageReport.update({
//       where: { id: reportId },
//       data: {
//         status: OutageStatus.ASSIGNED,
//         technicianId: technicianId,
//       },
//     });

//     await tx.technician.update({
//       where: { id: technicianId },
//       data: { status: TechnicianStatus.ON_DUTY },
//     });

//     return updatedReport;
//   });
// };


const assignTechnicianManually = async (
  reportId: string,
  technicianId: string,
  managerUserId: string,
): Promise<IManualAssignmentResponse> => {
  return await prisma.$transaction(async (tx) => {
    // ১. প্রথমে চেক করা যে এই কমপ্লেন বা আউটেজ রিপোর্টটি আসলেই ডাটাবেসে আছে কিনা
    const report = await tx.outageReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Outage report ticket not found!");
    }

    // 🛡️ অ্যাডভান্সড বিজনেস গার্ড: টিকিট অলরেডি রিস্টোর্ড (Resolved) হয়ে গেলে যেন নতুন করে টেকনিশিয়ান অ্যাসাইন না হয়
    if (report.status === OutageStatus.RESTORED) {
      throw new Error("This outage ticket is already resolved and power is restored! Cannot assign a technician.");
    }

    // 🛡️ ডুপ্লিকেট অ্যাসাইনমেন্ট প্রটেকশন: যদি অলরেডি কোনো টেকনিশিয়ান কাজ করতে থাকে
    if (report.technicianId) {
      throw new Error("A technician is already assigned to this outage ticket!");
    }

    // ২. এবার টেকনিশিয়ানের প্রোফাইল ও তার স্ট্যাটাস চেক করা
    const technician = await tx.technician.findUnique({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new Error("Selected Technician profile not found!");
    }

    // টেকনিশিয়ান ফ্রি (AVAILABLE) আছে কিনা নিশ্চিত করা
    if (technician.status !== TechnicianStatus.AVAILABLE) {
      throw new Error(
        `This technician is currently ${technician.status}. Cannot assign until they are AVAILABLE!`,
      );
    }

    // ৩. টিকিটের স্ট্যাটাস ASSIGNED করা এবং টেকনিশিয়ান ম্যাপ করা
    const updatedReport = await tx.outageReport.update({
      where: { id: reportId },
      data: {
        status: OutageStatus.ASSIGNED,
        technicianId: technicianId,
      },
    });

    // ৪. টেকniশিয়ানকে লক (ON_DUTY) করে দেওয়া
    await tx.technician.update({
      where: { id: technicianId },
      data: { status: TechnicianStatus.ON_DUTY },
    });

     await tx.auditLog.create({
      data: {
        userId: managerUserId, // টোকেন থেকে আসা লগইনড জোন ম্যানেজারের ইউজার আইডি
        action: "ASSIGN_TECHNICIAN",
        details: `Zone Manager manually assigned Technician (ID: ${technicianId}) to Outage Report (ID: ${reportId}).`,
      },
    });

    return {
      success: true,
      message: "Technician has been successfully assigned to the outage ticket manually.",
      report: updatedReport,
    };
  });
};


const getAllTechniciansFromDB = async (filters: ITechnicianFilterableFields, options: any) => {
  const { searchTerm, status, zoneId } = filters;
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.TechnicianWhereInput[] = [];

  // ১. সার্চিং লজিক (নাম, ইমেইল বা স্পেশালাইজেশন দিয়ে সার্চ)
  if (searchTerm) {
    andConditions.push({
      user: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    });
  }

  // ২. ফিল্টারিং লজিক (Status এবং ZoneId)
  if (status) {
    andConditions.push({ status: status as any });
  }
  if (zoneId) {
    andConditions.push({ zoneId });
  }

  const whereConditions: Prisma.TechnicianWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ৩. ডাটা ফেচ করা
  const data = await prisma.technician.findMany({
    where: whereConditions,
    skip: Number(skip),
    take: Number(limit),
    orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, phone: true, profileImage: true },
      },
      zone: { select: { name: true } },
    },
  });

  // ৪. টোটাল কাউন্ট
  const total = await prisma.technician.count({ where: whereConditions });

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data,
  };
};


const getAllOutageReportsFromDB = async (filters: IOutageReportFilterableFields, options: any) => {
  const { searchTerm, status, areaId } = filters;
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.OutageReportWhereInput[] = [];

  // ১. সার্চিং লজিক
  if (searchTerm) {
    andConditions.push({
      OR: [
        { description: { contains: searchTerm, mode: "insensitive" } },
        { 
          customer: { 
            user: { 
              name: { contains: searchTerm, mode: "insensitive" } 
            } 
          } 
        }
      ],
    });
  }

  // ২. ফিল্টারিং লজিক (Status)
  if (status) {
    andConditions.push({ status: status as any });
  }

  // ৩. এরিয়া আইডি ফিল্টার (কাস্টমারের ভেতর দিয়ে এরিয়া ফিল্টার করা)
  if (areaId) {
    andConditions.push({
      customer: {
        areaId: areaId as string,
      },
    });
  }

  const whereConditions: Prisma.OutageReportWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ৪. 👑 ডাটা ফেচ করা (ভুল include ফিক্সড)
  const data = await prisma.outageReport.findMany({
    where: whereConditions,
    skip: Number(skip),
    take: Number(limit),
    orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      // ⚡ ম্যাজিক এখানে: customer এর ভেতর দিয়ে user এবং area দুটাকেই একসাথে নিয়ে আসা
      customer: { 
        include: { 
          user: { 
            select: { 
              name: true, 
              email: true 
            } 
          },
          area: { // 💡 যেহেতু কাস্টমার এরিয়ার সাথে যুক্ত, তাই area এখানে থাকবে!
            select: { 
              name: true 
            } 
          }
        } 
      },
      technician: {
        include: { 
          user: { 
            select: { 
              name: true 
            } 
          } 
        }
      }
    },
  });

  const total = await prisma.outageReport.count({ where: whereConditions });

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data,
  };
};


const softDeleteOutageReportFromDB = async (reportId: string) => {
  // ১. চেক করা যে রিপোর্টটি আছে কিনা এবং অলরেডি ডিলিট হয়ে গেছে কিনা
  const report = await prisma.outageReport.findUnique({
    where: { id: reportId },
  });

  if (!report || report.isDeleted) {
    throw new Error("Outage report ticket not found or already deleted!");
  }

  // ২. 🛡️ সফট ডিলিট করা
  const result = await prisma.outageReport.update({
    where: { id: reportId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
};

export const OutageService = {
  reportUnexpectedOutage,
  resolveOutageJob,
  getActiveOutageByArea,
  assignTechnicianManually,
  createScheduledOutageInDB,
  getAllScheduledOutagesFromDB,
  getAllTechniciansFromDB,
  getAllOutageReportsFromDB,
  softDeleteOutageReportFromDB
};
