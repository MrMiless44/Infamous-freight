import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ status: "Infæmous Freight API LIVE" });
});

app.post("/load/quote", (req, res) => {
  const { miles, weight } = req.body;
  const rate = miles * 2.5;
  const profit = rate - weight * 0.6;

  res.json({
    rate,
    estimated_profit: profit
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚚 Backend running on port ${PORT}`)
);
