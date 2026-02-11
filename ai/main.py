def predict_profit(origin: str, destination: str, miles: float, weight: float) -> dict:
    """
    Compute a simple profit score and recommendation for a load.

    This function is framework-agnostic and can be called from the
    existing Express/TypeScript-based AI services, avoiding the need
    for a separate FastAPI service in this repository.
    """
    score = (miles * 1.8) - (weight * 0.4)
    return {
        "origin": origin,
        "destination": destination,
        "profit_score": round(score, 2),
        "recommendation": "ACCEPT" if score > 500 else "REJECT",
    }
