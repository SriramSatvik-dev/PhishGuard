import joblib
import pandas as pd
import os

BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH    = os.path.join(BASE_DIR, "ml", "models", "final_model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "ml", "models", "feature_names.pkl")

model         = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURES_PATH)


def predict(features: dict) -> dict:
    """
    Takes a feature dict from extract_features(),
    returns ML verdict and confidence score.
    """
    # Build a dataframe with exactly the columns the model was trained on
    # Missing features default to 0
    row = {f: features.get(f, 0) for f in feature_names}
    X   = pd.DataFrame([row])[feature_names]

    prediction  = model.predict(X)[0]
    probability = model.predict_proba(X)[0]

    return {
        "ml_verdict"    : "phishing" if prediction == 1 else "legitimate",
        "ml_confidence" : round(float(probability[prediction]) * 100, 2),
        "ml_phishing_probability": round(float(probability[1]) * 100, 2)
    }