import xgboost as xgb
import joblib
import os

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH    = os.path.join(BASE_DIR, "ml", "models", "final_model.json")
FEATURES_PATH = os.path.join(BASE_DIR, "ml", "models", "feature_names.pkl")

if os.path.exists(MODEL_PATH):
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    print("Model loaded successfully")
else:
    model         = None
    feature_names = []
    print("WARNING: Model not found")


def predict(features: dict) -> dict:
    if model is None:
        return {
            "ml_verdict"              : "unknown",
            "ml_confidence"           : 0,
            "ml_phishing_probability" : 0
        }

    import pandas as pd
    row = {f: features.get(f, 0) for f in feature_names}
    X   = pd.DataFrame([row])[feature_names]

    prediction  = int(model.predict(X)[0])
    probability = model.predict_proba(X)[0]

    return {
        "ml_verdict"              : "phishing" if prediction == 1 else "legitimate",
        "ml_confidence"           : round(float(probability[prediction]) * 100, 2),
        "ml_phishing_probability" : round(float(probability[1]) * 100, 2)
    }