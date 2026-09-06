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
    { type: OutageType.SCHEDULED }
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


const reportUnexpectedOutage = async (payload: any): Promise<any> => {
  const { customerId, areaId, description } = payload;

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
        customerId,
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
        customerId,
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

const resolveOutageJob = async (reportId: string): Promise<any> => {
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

    const updatedReport = await tx.outageReport.update({
      where: { id: reportId },
      data: {
        status: OutageStatus.RESTORED,
      },
    });

    if (report.technicianId) {
      await tx.technician.update({
        where: { id: report.technicianId },
        data: {
          status: TechnicianStatus.AVAILABLE,
        },
      });
    }

    if ((report as any).outageId) {
      await tx.outage.update({
        where: { id: (report as any).outageId },
        data: {
          status: OutageStatus.RESTORED,
          endTime: new Date(),
        },
      });
    }

    return {
      success: true,
      message:
        "⚡ Power Restored successfully! Job resolved directly via report ticket.",
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

const assignTechnicianManually = async (
  reportId: string,
  technicianId: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const technician = await tx.technician.findUnique({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new Error("Selected Technician profile not found!");
    }

    if (technician.status !== TechnicianStatus.AVAILABLE) {
      throw new Error(
        "This technician is currently ON_DUTY or OFFLINE. Cannot assign!",
      );
    }

    const updatedReport = await tx.outageReport.update({
      where: { id: reportId },
      data: {
        status: OutageStatus.ASSIGNED,
        technicianId: technicianId,
      },
    });

    await tx.technician.update({
      where: { id: technicianId },
      data: { status: TechnicianStatus.ON_DUTY },
    });

    return updatedReport;
  });
};

export const OutageService = {
  reportUnexpectedOutage,
  resolveOutageJob,
  getActiveOutageByArea,
  assignTechnicianManually,
  createScheduledOutageInDB,
  getAllScheduledOutagesFromDB,
};
