from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Load(BaseModel):
    origin: str
    destination: str
    weight: float
    miles: float


@app.post("/optimize")
def optimize(load: Load):
    profit = (load.weight * 1.4) - (load.miles * 0.6)
    return {
        "recommended": profit > 500,
        "estimated_profit": round(profit, 2)
    }
