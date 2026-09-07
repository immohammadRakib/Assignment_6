import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OutageService } from "./outage.service";

const createScheduledOutage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.createScheduledOutageInDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Load shedding schedule created successfully by Power Operator.",
      data: result,
    });
  },
);

const getAllScheduledOutages = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.getAllScheduledOutagesFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Load shedding schedules retrieved successfully.",
      data: result,
    });
  },
);

const reportUnexpectedOutage = catchAsync(
  async (req: Request, res: Response) => {
    const loginUser = (req as any).user;

    const payload = {
      customerId: req.body.customerId || loginUser?.profileId,
      areaId: req.body.areaId || loginUser?.areaId,
      description: req.body.description,
    };

    if (!payload.customerId || !payload.areaId) {
      throw new Error(
        "customerId and areaId are mandatory to report an outage!",
      );
    }

    const result = await OutageService.reportUnexpectedOutage(payload);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

// const resolveOutageJob = catchAsync(async (req: Request, res: Response) => {
//   const reportId = req.params.reportId as string;

//   if (!reportId) {
//     throw new Error("reportId is required in route parameter!");
//   }

//   const result = await OutageService.resolveOutageJob(reportId);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Power grid supply restored and technician released successfully.",
//     data: result,
//   });
// });

const resolveOutageJob = catchAsync(async (req: Request, res: Response) => {
  const reportId = req.params.reportId as string;

  if (!reportId) {
    throw new Error("reportId is required in route parameter!");
  }

  const result = await OutageService.resolveOutageJob(reportId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Power grid supply restored and technician released successfully.",
    data: result,
  });
});


const getMyAreaLiveStatus = catchAsync(async (req: Request, res: Response) => {
  const loginUser = (req as any).user;
  const areaId = req.query.areaId || loginUser?.areaId;

  if (!areaId) {
    throw new Error("areaId query parameter is required!");
  }

  const result = await OutageService.getActiveOutageByArea(areaId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result
      ? "Active outage detected in your area."
      : "Grid is healthy.",
    data: result || {
      status: "HEALTHY",
      message: "Power is active and stable.",
    },
  });
});

const assignTechnicianManually = catchAsync(
  async (req: Request, res: Response) => {
    const { reportId, technicianId } = req.body;
    const loginUser = (req as any).user;
    const managerUserId = (loginUser?.id || loginUser?.userId) as string;

    if (!reportId || !technicianId) {
      throw new Error(
        "reportId and technicianId are required in request body!",
      );
    }

    if (!managerUserId) {
    throw new Error("Authentication failed! Active user contexts are missing.");
  }

    const result = await OutageService.assignTechnicianManually(
      reportId,
      technicianId,
      managerUserId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Technician has been successfully assigned to the outage ticket manually.",
      data: result,
    });
  },
);

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  // কুয়েরি থেকে ফিল্টার আলাদা করা
  const filters = {
    searchTerm: req.query.searchTerm as string,
    status: req.query.status as string,
    zoneId: req.query.zoneId as string,
  };

  // কুয়েরি থেকে পেজিনেশন অপশন আলাদা করা
  const options = {
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await OutageService.getAllTechniciansFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technicians retrieved successfully for Zone Manager.",
    data: result,
  });
});

const getAllOutageReports = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    status: req.query.status as string,
    areaId: req.query.areaId as string,
  };

  const options = {
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await OutageService.getAllOutageReportsFromDB(
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Outage complaint reports retrieved successfully.",
    data: result,
  });
});

const softDeleteOutageReport = catchAsync(
  async (req: Request, res: Response) => {
    const { reportId } = req.params; // URL থেকে টিকিট আইডি নেওয়া

    const result = await OutageService.softDeleteOutageReportFromDB(
      reportId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Outage complaint report ticket soft deleted successfully.",
      data: result,
    });
  },
);

export const OutageController = {
  reportUnexpectedOutage,
  resolveOutageJob,
  getMyAreaLiveStatus,
  assignTechnicianManually,
  createScheduledOutage,
  getAllScheduledOutages,
  getAllTechnicians,
  getAllOutageReports,
  softDeleteOutageReport,
};
