from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Load and preprocess your CSV ---
df = pd.read_csv("BrewLogicMenu.csv")
ingredients = df['Contains'].str.get_dummies(sep=';')
df = pd.concat([df, ingredients], axis=1)
df = pd.get_dummies(df, columns=['Flavor','Temperature (usual)','Type'])
df = df.drop(columns=['Contains'])

feature_cols = [col for col in df.columns if col != 'Product']

def recommend_drinks(preferences, top_n=5):
    query = pd.DataFrame([[0]*len(feature_cols)], columns=feature_cols)
    for pref in preferences:
        for col in feature_cols:
            if pref.lower() in col.lower():
                query[col] = 1
    scores = (df[feature_cols].values @ query.values.T).ravel()
    df['score'] = scores
    return df.sort_values('score', ascending=False).head(top_n)['Product'].tolist()

# --- Flask route ---
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    prefs = data.get("preferences", [])
    results = recommend_drinks(prefs)
    return jsonify({"recommendations": results})

if __name__ == "__main__":
    app.run(debug=True)
