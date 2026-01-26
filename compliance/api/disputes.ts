import { Request, Response, NextFunction } from "express";
import prisma from "../db";

export async function createDispute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, transactionId, processor } = req.body;

    const dispute = await prisma.dispute.create({
      data: { userId, transactionId, processor, status: "OPEN" },
    });

    res.json(dispute);
  } catch (err) {
    next(err);
  }
}
