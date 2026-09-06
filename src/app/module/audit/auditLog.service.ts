import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";
import { paginationHelper } from "../../utils/paginationHelper";
import { IAuditLogFilterableFields } from "./auditLog.interface";

const createLog = async (
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  details: string,
) => {
  return await tx.auditLog.create({
    data: { userId, action, details },
  });
};

const getAllLogsFromDB = async (
  filters: IAuditLogFilterableFields,
  options: any,
) => {
  const { searchTerm, action } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { details: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (action) {
    andConditions.push({ action: action as string });
  }

  const whereConditions: Prisma.AuditLogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.auditLog.findMany({
    where: whereConditions,
    skip: Number(skip),
    take: Number(limit),
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  });

  const total = await prisma.auditLog.count({ where: whereConditions });

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data,
  };
};

export const AuditLogService = {
  createLog,
  getAllLogsFromDB,
};
