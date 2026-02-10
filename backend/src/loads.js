import express from "express";

export default (prisma) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const load = await prisma.load.create({ data: req.body });
    res.json(load);
  });

  router.get("/", async (_, res) => {
    const loads = await prisma.load.findMany();
    res.json(loads);
  });

  return router;
};
