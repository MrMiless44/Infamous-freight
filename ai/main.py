from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Load(BaseModel):
    origin: str
    destination: str
    miles: float
    weight: float


@app.post("/predict")
def predict(load: Load):
    score = (load.miles * 1.8) - (load.weight * 0.4)
    return {
        "profit_score": round(score, 2),
        "recommendation": "ACCEPT" if score > 500 else "REJECT",
    }
