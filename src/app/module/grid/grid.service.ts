import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";

const createPowerAuthorityInDB = async (payload: any) => {
  return await prisma.powerAuthority.create({ data: payload });
};

const createZoneInDB = async (payload: any) => {
  return await prisma.distributionZone.create({ data: payload });
};

const createSubstationInDB = async (payload: any) => {
  return await prisma.substation.create({ data: payload });
};

const createFeederInDB = async (payload: any) => {
  return await prisma.feeder.create({ data: payload });
};

const createAreaInDB = async (payload: any) => {
  return await prisma.area.create({ data: payload });
};

const softDeleteAreaFromDB = async (areaId: string) => {
  const area = await prisma.area.findUnique({
    where: { id: areaId },
  });

  if (!area || area.isDeleted) {
    throw new Error("Area not found or already deleted!");
  }

  const result = await prisma.area.update({
    where: { id: areaId },
    data: {
      isDeleted: true,
      deletedAt: new Date() 
    },
  });

  return result;
};




const getAllZonesFromDB = async () => {
  return await prisma.distributionZone.findMany({
    include: {
      powerAuthority: true, // জোনের সাথে কোন অথরিটি তা দেখাবে
    },
  });
};

// ২. সব সাবস্টেশন তুলে আনা (জোন ও অথরিটিসহ)
const getAllSubstationsFromDB = async () => {
  return await prisma.substation.findMany({
    include: {
      zone: {
        include: { powerAuthority: true }
      },
    },
  });
};

// ৩. সব ফিডার লাইন তুলে আনা
const getAllFeedersFromDB = async () => {
  return await prisma.feeder.findMany({
    include: {
      substation: true,
      areas: {
        where: { isDeleted: false } // শুধুমাত্র ডিলিট না হওয়া এরিয়া দেখাবে
      }
    },
  });
};

// ৪. সব এরিয়া তুলে আনা (রোল ভিত্তিক ফিল্টারিং এর সুবিধার্থে)
const getAllAreasFromDB = async (query: any) => {
  const { searchTerm, priority } = query;
  const whereConditions: Prisma.AreaWhereInput = { isDeleted: false };

  // সার্চ টার্ম থাকলে নাম দিয়ে ফিল্টার
  if (searchTerm) {
    whereConditions.name = {
      contains: searchTerm,
      mode: "insensitive",
    };
  }

  // প্রায়োরিটি (VIP/NORMAL) ফিল্টার
  if (priority) {
    whereConditions.priority = priority; 
  }

  return await prisma.area.findMany({
    where: whereConditions,
    include: {
      feeder: {
        include: { substation: true }
      },
    },
  });
};


export const GridServices = {
  createPowerAuthorityInDB,
  createZoneInDB,
  createSubstationInDB,
  createFeederInDB,
  createAreaInDB,
  softDeleteAreaFromDB,
  getAllZonesFromDB,
  getAllSubstationsFromDB,
  getAllFeedersFromDB,
  getAllAreasFromDB,
};
