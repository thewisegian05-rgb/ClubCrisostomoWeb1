from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

app = Flask(__name__)

# Configured CORS to allow all origins and properly respond to preflight OPTIONS requests
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["POST", "GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# load and preprocess the data
df = pd.read_csv("BrewLogicMenu.csv")
ingredients = df['Contains'].str.get_dummies(sep=';') # split ingredients into separate columns
df = pd.concat([df, ingredients], axis=1) # combine with original dataframe
df = pd.get_dummies(df, columns=['Flavor','Temperature (usual)','Type']) # one-hot encode categorical features
df = df.drop(columns=['Contains']) # drop original 'Contains' column

feature_cols = [col for col in df.columns if col != 'Product'] # features for similarity

def recommend_drinks(preferences, top_n=5): # create a query vector based on user preferences
    query = pd.DataFrame([[0]*len(feature_cols)], columns=feature_cols) # initialize with zeros
    for pref in preferences: # set features to 1 if they match user preferences
        for col in feature_cols:
            if pref.lower() in col.lower():
                query[col] = 1
    
    scores = cosine_similarity(df[feature_cols].values, query.values).ravel() # compute similarity scores
    
    df['score'] = scores # add scores to dataframe
    return df.sort_values('score', ascending=False).head(top_n)['Product'].tolist() # return top N recommendations

# Flask route to handle recommendation requests
@app.route("/recommend", methods=["POST"]) # expects JSON with "preferences" key containing a list of user preferences
def recommend(): 
    data = request.json # get JSON data from request
    prefs = data.get("preferences", []) # get user preferences from request
    results = recommend_drinks(prefs) # get recommendations based on preferences
    return jsonify({"recommendations": results}) # return recommendations as JSON

if __name__ == "__main__": # run the Flask app in debug mode
    app.run(debug=True)