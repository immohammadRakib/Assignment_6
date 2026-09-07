import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GridServices } from "./grid.service";

const createPowerAuthority = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.createPowerAuthorityInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Power Authority created successfully",
    data: result,
  });
});

const createZone = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.createZoneInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Distribution Zone created successfully",
    data: result,
  });
});

const createSubstation = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.createSubstationInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Substation created successfully",
    data: result,
  });
});

const createFeeder = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.createFeederInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Feeder line created successfully",
    data: result,
  });
});

const createArea = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.createAreaInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Area created successfully",
    data: result,
  });
});

const softDeleteArea = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; 

  const result = await GridServices.softDeleteAreaFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Area has been soft deleted successfully!",
    data: result,
  });
});



const getAllZones = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.getAllZonesFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Distribution Zones fetched successfully",
    data: result,
  });
});

const getAllSubstations = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.getAllSubstationsFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Substations fetched successfully",
    data: result,
  });
});

const getAllFeeders = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.getAllFeedersFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feeder lines fetched successfully",
    data: result,
  });
});

const getAllAreas = catchAsync(async (req: Request, res: Response) => {
  const result = await GridServices.getAllAreasFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Areas fetched successfully",
    data: result,
  });
});


export const GridControllers = {
  createPowerAuthority,
  createZone,
  createSubstation,
  createFeeder,
  createArea,
  softDeleteArea,
  getAllZones,
  getAllSubstations,
  getAllFeeders,
  getAllAreas,
};
