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
      deletedAt: new Date(),
    },
  });

  return result;
};

const getAllZonesFromDB = async () => {
  return await prisma.distributionZone.findMany({
    include: {
      powerAuthority: true,
    },
  });
};

const getAllSubstationsFromDB = async () => {
  return await prisma.substation.findMany({
    include: {
      zone: {
        include: { powerAuthority: true },
      },
    },
  });
};

const getAllFeedersFromDB = async () => {
  return await prisma.feeder.findMany({
    include: {
      substation: true,
      areas: {
        where: { isDeleted: false },
      },
    },
  });
};

const getAllAreasFromDB = async (query: any) => {
  const { searchTerm, priority } = query;
  const whereConditions: Prisma.AreaWhereInput = { isDeleted: false };

  if (searchTerm) {
    whereConditions.name = {
      contains: searchTerm,
      mode: "insensitive",
    };
  }

  if (priority) {
    whereConditions.priority = priority;
  }

  return await prisma.area.findMany({
    where: whereConditions,
    include: {
      feeder: {
        include: { substation: true },
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
