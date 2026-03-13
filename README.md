# 🧘‍♂️ ArogyaMitra – AI Fitness & Wellness Platform

ArogyaMitra is an **AI-powered fitness and wellness platform** that provides personalized workout routines, nutrition guidance, and real-time AI coaching to help users maintain a healthy lifestyle.

The system analyzes user information such as fitness goals, lifestyle preferences, medical conditions, and available time to generate customized plans.

Users can interact with **AROMI**, an AI fitness coach that dynamically adjusts routines based on travel, injuries, mood, or time availability.

---

# 🚀 Features

* AI-generated **7-day workout plans**
* AI-powered **nutrition & meal planning**
* Interactive **AROMI AI coach**
* **JWT authentication** for secure user login
* Personalized **fitness dashboard**
* **Progress tracking system**
* Adaptive plans for **travel, injuries, or schedule changes**
* Fully functional **local mode with mock AI responses**

---

# 🏗 System Architecture

## Frontend

* React.js
* Vite
* Tailwind CSS
* Axios API communication
* React Router

## Backend

* FastAPI
* Python
* SQLAlchemy ORM
* JWT Authentication
* Bcrypt password hashing

## AI Integration

* Groq LLaMA-3.3-70B model
* Mock responses when API key is not available

## Database

* SQLite

---

# 📂 Project Structure

```
ArogyaMitra
│
├── backend
│   ├── api
│   │   └── routes
│   │       ├── auth.py
│   │       ├── ai.py
│   │       └── progress.py
│   │
│   ├── models
│   ├── schemas
│   ├── services
│   ├── core
│   ├── database.py
│   └── main.py
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Workout.jsx
│   │   │   ├── Nutrition.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Progress.jsx
│   │   │
│   │   ├── components
│   │   ├── api
│   │   └── App.jsx
│   │
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```
git clone https://github.com/Rohan-1810/ArogyaMitra.git
cd ArogyaMitra
```

---

# 🖥 Backend Setup (FastAPI)

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

Run backend:

```
uvicorn main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

API documentation:

```
http://localhost:8000/docs
```

---

# 🌐 Frontend Setup (React)

```
cd frontend
npm install
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

# 🤖 AI Integration

ArogyaMitra uses **Groq's LLaMA-3.3-70B model** to generate:

* workout plans
* nutrition plans
* coaching responses

If a **Groq API key is not provided**, the system automatically switches to **mock AI responses**, allowing the app to run locally.

---

# 🧠 Example Use Cases

## Scenario 1 – Workout Plan Generation

User selects:

```
Goal: Weight Loss
Workout Type: Home Workout
Time: 30 minutes/day
```

System generates:

* 7-day workout routine
* exercise instructions
* rest intervals
* daily fitness tips

---

## Scenario 2 – Nutrition Plan

User requests:

```
1800 calorie vegetarian diet
Allergies: peanuts and lactose
```

System generates:

* 7-day meal plan
* Indian cuisine meals
* macro breakdown
* recipe suggestions

---

## Scenario 3 – AROMI AI Coach

User message:

```
I am traveling for 4 days
```

AROMI adapts the plan:

* replaces gym workouts with travel exercises
* recommends walking & mobility routines
* suggests healthy meal alternatives

---

# 🛠 Tech Stack

### Backend

* FastAPI
* Python
* SQLAlchemy
* JWT Authentication
* Bcrypt

### Frontend

* React
* Vite
* Tailwind CSS
* Axios

### AI

* Groq LLaMA-3.3-70B

### Database

* SQLite

---

# 📊 Future Improvements

* PostgreSQL / Supabase database
* Docker deployment
* Workout analytics charts
* AI conversation memory
* Mobile app version
* Smart wearable integration

---
