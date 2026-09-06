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


export const GridServices = {
  createPowerAuthorityInDB,
  createZoneInDB,
  createSubstationInDB,
  createFeederInDB,
  createAreaInDB,
  softDeleteAreaFromDB,
};
