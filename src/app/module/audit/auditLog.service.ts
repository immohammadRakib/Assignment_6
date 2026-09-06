import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";
import { paginationHelper } from "../../utils/paginationHelper";
import { IAuditLogFilterableFields } from "./auditLog.interface";

// ১. গ্লোবাল মেথড (অন্য সব সার্ভিসের ট্রানজেকশন থেকে অটো-লগ করার জন্য)
const createLog = async (
  tx: Prisma.TransactionClient, 
  userId: string, 
  action: string, 
  details: string
) => {
  return await tx.auditLog.create({
    data: { userId, action, details },
  });
};

// ২. এডমিনের জন্য সব অডিট লগ পেজিনেশন ও সার্চ সহ দেখার মেথড
const getAllLogsFromDB = async (filters: IAuditLogFilterableFields, options: any) => {
  const { searchTerm, action } = filters;
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  // 🔍 সার্চিং লজিক (ইউজারের নাম, ইমেইল বা লগের ডিটেইলস লিখে সার্চ)
  if (searchTerm) {
    andConditions.push({
      OR: [
        { details: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  // 🗂️ ফিল্টারিং লজিক (নির্দিষ্ট অ্যাকশন টাইপ যেমন: ASSIGN_TECHNICIAN)
  if (action) {
    andConditions.push({ action: action as string });
  }

  const whereConditions: Prisma.AuditLogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ডাটাবেস থেকে কুয়েরি
  const data = await prisma.auditLog.findMany({
    where: whereConditions,
    skip: Number(skip),
    take: Number(limit),
    orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  });

  // টোটাল কাউন্ট
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
