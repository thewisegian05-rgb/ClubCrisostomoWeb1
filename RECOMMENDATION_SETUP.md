# Recommendation Feature - Setup & Usage Guide

## What's New
A **"Recommendation"** tab has been added to the homepage navigation. Users can now:
1. Scroll to the recommendation section or click the nav link
2. Select multiple preferences (sweet, bitter, hot, ingredients, etc.)
3. Click "Get Recommendation" to query your Flask AI model
4. See the top 5 recommended drinks based on their selections

## Setup Instructions

### Step 1: Install Flask Dependencies
Navigate to the flask folder and install required packages:

```bash
cd flask
pip install -r requirements.txt
```

**Required packages:**
- `Flask` - Web framework
- `flask-cors` - Enable CORS for React frontend
- `pandas` - Data manipulation

### Step 2: Run Flask Backend
Start the Flask server (keep it running while using the feature):

```bash
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Step 3: Run React Frontend
In another terminal, start the React dev server:

```bash
cd ClubCrisostomo
npm run dev
```

### Step 4: Test the Feature
1. Open your website
2. Scroll down or click **"Recommendation"** in the navbar
3. Select preferences (e.g., "Sweet", "Hot", "Espresso", "Milk")
4. Click **"Get Recommendation"**
5. View your personalized top 5 drink recommendations!

## How It Works

### Frontend Flow
1. User clicks preference buttons (toggleable, multi-select)
2. User clicks "Get Recommendation" button
3. React sends POST request to Flask: `{ "preferences": ["Sweet", "Hot", "Espresso"] }`
4. Flask returns: `{ "recommendations": ["Spanish Latte", "Hazelnut Latte", ...] }`
5. Recommendations display in a scrollable grid with rankings

### Backend Processing
- Flask receives preferences
- Matches preferences against menu CSV features
- Uses dot-product scoring to find best matches
- Returns top 5 drinks sorted by score

## Preference Categories

**Flavor:** Sweet, Bitter, Mild sweet, Savory, Sweet-Sour
**Temperature:** Hot, Cold
**Type:** Coffee, Non-coffee, Refreshers, Snacks
**Ingredients:** Espresso, Milk, Matcha, Hazelnut, Chocolate, Caramel, Vanilla, Cinnamon, Citrus, Strawberry, Blueberry, Berries, Oreos, Cereal, Tea, Ginger, Honey, Potato

## Troubleshooting

### "Unable to connect to recommendation service"
- ✓ Is Flask running on `localhost:5000`?
- ✓ Check Flask console for errors
- ✓ Run: `pip install -r requirements.txt`

### No recommendations shown
- Select at least one preference button
- Click "Get Recommendation" button
- Ensure preferences match menu items

### CORS Error in Console
- Install flask-cors: `pip install flask-cors`
- Restart Flask server

### pandas/numpy Compatibility Error
If `python app.py` fails with a message like:
- `ValueError: numpy.dtype size changed, may indicate binary incompatibility`

Then run:
```bash
cd flask
python -m pip install "numpy<2.0" "pandas==2.0.3" --force-reinstall
```

If you want to avoid this in future, use a virtual environment:
```bash
cd flask
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Files Modified/Created

**New Files:**
- `flask/requirements.txt`

**Modified Files:**
- `ClubCrisostomo/src/Pages/Homepage/HomepageMain.jsx` - Added recommendation section with state management
- `ClubCrisostomo/src/Components/HomepageComponents/Homepage.css` - Added styling for recommendation UI
- `flask/app.py` - Added CORS support

## API Reference

### Endpoint: POST `/recommend`

**Request:**
```json
{
  "preferences": ["Sweet", "Hot", "Milk"]
}
```

**Response:**
```json
{
  "recommendations": ["Spanish Latte", "Cinnamon Latte", "Hazelnut Latte", "Mochaccino", "Caramel Macchiato"]
}
```

## Features
✨ Smooth scroll navigation
✨ Multi-select preference buttons with active state styling
✨ Real-time API communication
✨ Top 5 recommendations with ranking badges
✨ Error handling and loading states
✨ Fully responsive mobile design
✨ Clear all preferences button
