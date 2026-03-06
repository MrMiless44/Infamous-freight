import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.listen(port, () => {
  console.log(`Infamous Freight API listening on port ${port}`);
});
