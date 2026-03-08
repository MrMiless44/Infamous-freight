import { Router } from "express";
import { DispatchController } from "./dispatch.controller.js";
import { requireScope } from "../../middleware/require-scope.js";

const controller = new DispatchController();
export const dispatchRouter = Router();

dispatchRouter.post(
  "/:loadId/recommend",
  requireScope("dispatch.recommend"),
  controller.recommend.bind(controller)
);

dispatchRouter.post(
  "/:loadId/assign/:driverId",
  requireScope("dispatch.assign"),
  controller.assign.bind(controller)
);
