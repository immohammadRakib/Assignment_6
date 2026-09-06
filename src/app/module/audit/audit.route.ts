
import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/browser";

// 👑 এই ফাংশনটি দিয়ে যেকোনো সার্ভিস থেকে লগ তৈরি করা যাবে
const createLog = async (tx: Prisma.TransactionClient, userId: string, action: string, details: string) => {
  return await tx.auditLog.create({
    data: {
      userId,
      action,
      details,
    },
  });
};

// এডমিন যেন ড্যাশবোর্ডে সব অডিট লগ পেজিনেশন সহ দেখতে পারে
const getAllLogsFromDB = async (options: any) => {
  // এখানে আপনার paginationHelper দিয়ে পেজিনেশন লজিক বসিয়ে দিবেন
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, role: true } } }
  });
  return logs;
};

export const AuditLogService = {
  createLog,
  getAllLogsFromDB
};
