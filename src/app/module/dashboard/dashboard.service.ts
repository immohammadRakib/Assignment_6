import { OutageStatus, OutageType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const getDashboardOverviewFromDB = async (userId: string, role: string) => {
  if (role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { id: true, balance: true, meterNumber: true, areaId: true },
    });

    if (!customer) throw new Error("Customer profile not found!");

    const activeOutagesInMyArea = customer.areaId
      ? await prisma.outage.count({
          where: { areaId: customer.areaId, status: OutageStatus.ACTIVE },
        })
      : 0;

    const [myPendingComplaints, myResolvedComplaints] = await Promise.all([
      prisma.outageReport.count({
        where: { customerId: customer.id, status: OutageStatus.PENDING },
      }),
      prisma.outageReport.count({
        where: { customerId: customer.id, status: OutageStatus.RESTORED },
      }),
    ]);

    return {
      role,
      currentBalance: customer.balance || 0,
      meterNumber: customer.meterNumber || "N/A",
      isPowerActive: activeOutagesInMyArea === 0,
      myPendingComplaints,
      myResolvedComplaints,
    };
  }

  if (role === "POWER_OPERATOR") {
    const operator = await prisma.powerOperator.findUnique({
      where: { userId },
      select: { substationId: true },
    });

    if (!operator || !operator.substationId) {
      throw new Error(
        "Power Operator profile or assigned Substation not found!",
      );
    }

    const totalMyFeeders = await prisma.feeder.count({
      where: { substationId: operator.substationId as string },
    });

    const activeSchedulesUnderMe = await prisma.outage.count({
      where: {
        type: OutageType.SCHEDULED,
        status: OutageStatus.ACTIVE,
        area: { feeder: { substationId: operator.substationId as string } },
      },
    });

    return {
      role,
      totalMyFeeders,
      activeSchedulesUnderMe,
      operatorSubstationId: operator.substationId,
    };
  }

  if (role === "ZONE_MANAGER") {
    const manager = await prisma.zoneManager.findUnique({
      where: { userId },
      select: { zoneId: true },
    });

    if (!manager || !manager.zoneId) {
      throw new Error("Zone Manager profile or assigned Zone not found!");
    }

    const [
      myZoneCustomers,
      myZoneTechnicians,
      myZoneActiveOutages,
      myZonePendingReports,
    ] = await Promise.all([
      prisma.customer.count({
        where: {
          area: {
            feeder: { substation: { zoneId: manager.zoneId as string } },
          },
          isDeleted: false,
        },
      }),
      prisma.technician.count({
        where: { zoneId: manager.zoneId as string, isDeleted: false },
      }),
      prisma.outage.count({
        where: {
          area: {
            feeder: { substation: { zoneId: manager.zoneId as string } },
          },
          status: OutageStatus.ACTIVE,
        },
      }),
      prisma.outageReport.count({
        where: {
          customer: {
            area: {
              feeder: { substation: { zoneId: manager.zoneId as string } },
            },
          },
          status: OutageStatus.PENDING,
        },
      }),
    ]);

    return {
      role,
      zoneId: manager.zoneId,
      totalCustomers: myZoneCustomers,
      totalTechnicians: myZoneTechnicians,
      activeLoadShedding: myZoneActiveOutages,
      pendingComplaints: myZonePendingReports,
    };
  }

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    const [
      globalCustomers,
      globalTechnicians,
      globalManagers,
      globalOperators,
      globalActiveOutages,
      globalPendingReports,
      globalResolvedReports,
      walletAggregation,
    ] = await Promise.all([
      prisma.customer.count({ where: { isDeleted: false } }),
      prisma.technician.count({ where: { isDeleted: false } }),
      prisma.zoneManager.count({ where: { isDeleted: false } }),
      prisma.powerOperator.count({ where: { isDeleted: false } }),
      prisma.outage.count({
        where: { type: OutageType.SCHEDULED, status: OutageStatus.ACTIVE },
      }),
      prisma.outageReport.count({ where: { status: OutageStatus.PENDING } }),
      prisma.outageReport.count({ where: { status: OutageStatus.RESTORED } }),
      prisma.customer.aggregate({ _sum: { balance: true } }),
    ]);

    return {
      role,
      totalCustomers: globalCustomers,
      totalTechnicians: globalTechnicians,
      totalZoneManagers: globalManagers,
      totalPowerOperators: globalOperators,
      activeLoadShedding: globalActiveOutages,
      pendingComplaints: globalPendingReports,
      resolvedComplaints: globalResolvedReports,
      totalRevenue: walletAggregation._sum.balance || 0,
      gridHealthScore:
        globalActiveOutages > 0 ? "Warning - Active Outages" : "100% Stable",
    };
  }

  throw new Error("Unauthorized role context for dashboard overview!");
};

export const DashboardService = {
  getDashboardOverviewFromDB,
};
