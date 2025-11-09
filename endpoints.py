from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import joblib, numpy as np

# --- Load your saved model and calibration constants ---
rf = joblib.load("yarko_rf_model.pkl")
cal = np.load("yarko_calibration.npz")
a_cal, b_cal = float(cal["a_cal"]), float(cal["b_cal"])

# --- Priors ---
pv_priors = {"C":0.06,"S":0.23,"V":0.30,"D":0.04,"X":0.12,"UNKNOWN":0.14}
p_retro_default = 0.67

app = FastAPI(title="Yarkovsky Drift Predictor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AsteroidInput(BaseModel):
    H: float
    a: float
    e: float
    Tax: str = "UNKNOWN"
    D_km: float | None = None
    known_sign: int | None = None
    
class BatchInput(BaseModel):
    asteroids: list[AsteroidInput]
    

def predict_da_dt(H, a, e, Tax="UNKNOWN", D_km=None, known_sign=None):
    if D_km is None:
        pv = pv_priors.get(Tax.upper(), 0.14)
        D_km = 1329/np.sqrt(pv)*10**(-H/5)

    logD = np.log10(D_km)
    invD = 1.0 / D_km
    flux_avg = 1.0/(a**2 * np.sqrt(1 - e**2))
    X_pred = np.array([[logD, invD, a, e, flux_avg]])

    logmag = rf.predict(X_pred)[0]
    mag = 10**(a_cal + b_cal * logmag)

    if known_sign in (-1, 1):
        s = known_sign
    else:
        s = -1 if np.random.rand() < p_retro_default else 1
    return s * mag


@app.post("/predict")
def predict(input: AsteroidInput):
    """
    [Summary] API endpoint to predict da/dt.
    
    Required inputs:
    - H: Absolute magnitude
    - a: Semi-major axis (au)
    - e: Eccentricity
    
    Optional inputs:
    - Tax: Taxonomic type (default "UNKNOWN")
    - D_km: Diameter in km (if not provided, estimated from H and Tax)
    - known_sign: Known sign of da/dt (+1 or -1), if available
    
    Returns:
    - da_dt: Predicted semi-major axis drift in au/Myr
    - units: Units of the prediction
    """
    da_dt = predict_da_dt(input.H, input.a, input.e,
                          input.Tax, input.D_km, input.known_sign)
    return {"da_dt": da_dt, "units": "au/Myr"}


# --- Batch prediction endpoint ---
@app.post("/batch_predict")
def batch_predict(batch: BatchInput):
    asteroids = batch.asteroids
    if len(asteroids) > 10:
        raise HTTPException(status_code=400, detail="Limit is 10 asteroids per request.")
    
    results = []
    for i, a in enumerate(asteroids):
        da_dt = predict_da_dt(a.H, a.a, a.e, a.Tax, a.D_km, a.known_sign)
        results.append({
            "index": i,
            "H": a.H,
            "a": a.a,
            "e": a.e,
            "Tax": a.Tax,
            "D_km": a.D_km,
            "da_dt": da_dt,
            "units": "au/Myr"
        })
    return {"count": len(results), "results": results}


# --- Helpers for the frontend ---
@app.get("/asteroids")
def get_asteroids(page: int = 0, page_size: int = 20):
    """
    Gets a list of asteroids from NASA JPL Small-Body Database.
    Workaround for CORS
    """
    params = {
        "fields":"full_name,epoch,a,e,i,om,w,ma,H,moid",
        "sb-kind":"a",
        "limit":page_size,
        "limit-from": page * page_size
    }
    response = requests.get(
        "https://ssd-api.jpl.nasa.gov/sbdb_query.api",
        params=params
        )
    fields = response.json().get("fields", [])
    values = response.json().get("data", [])
    
    asteroids = []
    for v in values:
        v = [str(x).strip() if isinstance(x, str) else x for x in v]
        asteroid = dict(zip(fields, v))
        asteroids.append(asteroid)
    
    return {"asteroids": asteroids}