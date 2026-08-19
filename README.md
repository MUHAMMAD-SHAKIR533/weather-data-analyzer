# 🌦️ Weather Data Analyzer

> A modern weather analytics dashboard built with **Next.js, TypeScript, Python, and NumPy**.

**Weather Data Analyzer** is a web-based application that turns real weather data into meaningful visual insights. Users can search for locations, view current weather conditions, explore historical records, analyze trends through interactive charts, and inspect statistical summaries.

The project also demonstrates how **Python fundamentals and NumPy** can be applied to real-world weather datasets.

### 🔗 Live Demo

**[Weather Data Analyzer](https://weather-data-analyzer.vercel.app/)**

---

## ✨ Features

### 🌍 Location Search

* Search for cities and locations.
* Retrieve geographic coordinates through Open-Meteo.
* Select a location to analyze its weather data.

### 🌤️ Current Weather

View important real-time weather information, including:

* Temperature
* Humidity
* Wind speed
* Weather conditions
* Location information

### 📊 Weather Data

Explore historical weather records through:

* Structured data tables
* Temperature records
* Humidity measurements
* Rainfall data
* Wind measurements
* Filtering and sorting

### 📈 Interactive Analysis

Visualize weather trends using interactive charts:

* Temperature trends
* Humidity trends
* Rainfall analysis
* Wind-speed analysis
* Historical comparisons

### 📐 Statistical Analysis

The application calculates useful statistical measurements such as:

* Mean
* Median
* Minimum
* Maximum
* Standard deviation

These calculations are implemented in TypeScript for the production application and reproduced using NumPy in the educational Python component.

### 🧮 Python & NumPy Section

A dedicated section demonstrates how the same type of weather analysis can be performed using:

```text
Python
   ↓
NumPy
   ↓
Weather Dataset
   ↓
Statistical Analysis
   ↓
Precomputed Results
```

The Python component is intentionally kept separate from the production Next.js runtime.

### 📱 Responsive Design

The dashboard is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile

---

## 🛠️ Technology Stack

| Technology              | Purpose                           |
| ----------------------- | --------------------------------- |
| **Next.js**             | Application framework             |
| **TypeScript**          | Application logic and type safety |
| **React**               | User interface                    |
| **Tailwind CSS**        | Styling and responsive design     |
| **Recharts**            | Interactive charts                |
| **Lucide React**        | Interface icons                   |
| **Open-Meteo**          | Weather and geocoding data        |
| **Supabase PostgreSQL** | Cache and weather history storage |
| **Python**              | Educational data analysis         |
| **NumPy**               | Numerical/statistical analysis    |
| **Vercel**              | Deployment                        |

---

## 🏗️ Architecture

The application uses a simple, free-tier-friendly architecture:

```text
                    ┌──────────────────────┐
                    │       User           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Next.js App      │
                    │  React + TypeScript  │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ Open-Meteo  │ │  Supabase   │ │ Statistics  │
        │     API     │ │ PostgreSQL  │ │   Module    │
        └─────────────┘ └─────────────┘ └─────────────┘
                                              
                    ┌──────────────────────┐
                    │  Python + NumPy      │
                    │ Offline Analysis     │
                    └──────────────────────┘
```

### Data Flow

1. User searches for a location.
2. Next.js communicates with Open-Meteo.
3. Weather data is retrieved and validated.
4. Supabase can cache/store relevant weather history.
5. TypeScript analysis functions process production data.
6. Charts and statistics present the results.
7. Python + NumPy provides an independent educational implementation using precomputed data.

---

## ☁️ Why Open-Meteo?

Open-Meteo provides weather and geocoding APIs without requiring an API key for this project.

This keeps the application:

* Simple
* Free-tier friendly
* Easy to deploy
* Suitable for a student project

---

## 🗄️ Database

The project uses **Supabase PostgreSQL** as a lightweight cache and history store.

The database is intentionally limited to weather information relevant to the application instead of attempting to store every request made to the weather API.

The database architecture is documented in:

**[`DATABASE.md`](./DATABASE.md)**

---

## 🐍 Python & NumPy

Python and NumPy are used as an educational component of the project.

The Python implementation demonstrates fundamental concepts such as:

* Variables
* Lists
* Functions
* Loops
* Conditional statements
* Arrays
* NumPy arrays
* Statistical calculations
* Dataset processing

The production application does **not** execute Python or NumPy at request time.

Instead:

```text
Python + NumPy
       ↓
Offline Analysis
       ↓
JSON Output
       ↓
Next.js NumPy Analysis Page
```

This approach keeps the Vercel deployment simple while still demonstrating practical Python and NumPy skills.

---

## 📁 Project Structure

```text
weather-data-analyzer/
│
├── app/
│   ├── about/
│   ├── analysis/
│   ├── data/
│   ├── numpy-analysis/
│   ├── statistics/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   └── ...
│
├── lib/
│   ├── weather/
│   ├── statistics/
│   └── supabase/
│
├── python/
│   └── ...
│
├── database/
│   └── ...
│
├── public/
│
├── types/
│
├── sample-data.json
├── API.md
├── ARCHITECTURE.md
├── DATABASE.md
├── DESIGN.md
├── DEPLOYMENT.md
├── PYTHON_NUMPY.md
├── UI.md
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MUHAMMAD-SHAKIR533/weather-data-analyzer.git
```

Move into the project directory:

```bash
cd weather-data-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_NAME=Weather Data Analyzer
```

> **Never commit `.env.local` or your Supabase service-role key to GitHub.**

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔍 Available Commands

### Development

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Type checking

```bash
npm run typecheck
```

### Production build

```bash
npm run build
```

---

## 🌐 Deployment

The application is deployed using **Vercel**.

### Deployment flow

```text
GitHub
   ↓
Push to main
   ↓
Vercel
   ↓
Next.js Production Build
   ↓
Live Application
```

Production environment variables must be configured in the Vercel project settings.

Required variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_NAME
```

### Live Application

**[Open Weather Data Analyzer](https://weather-data-analyzer.vercel.app/)**

---

## 📚 Documentation

The repository contains detailed technical documentation:

| Document                               | Description                            |
| -------------------------------------- | -------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Application architecture and data flow |
| [`API.md`](./API.md)                   | API routes and response structures     |
| [`DATABASE.md`](./DATABASE.md)         | Supabase database design               |
| [`DESIGN.md`](./DESIGN.md)             | Visual design system                   |
| [`UI.md`](./UI.md)                     | Page and component specifications      |
| [`PYTHON_NUMPY.md`](./PYTHON_NUMPY.md) | Python and NumPy implementation        |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)     | Deployment instructions                |
| [`TODO.md`](./TODO.md)                 | Development roadmap                    |

---

## 🎯 Project Goals

This project was created to demonstrate how fundamental programming and data-analysis concepts can be combined into a practical application.

### Python Fundamentals

The project applies:

* Variables and data types
* Strings
* Lists
* Tuples
* Sets
* Dictionaries
* Conditional statements
* Loops
* Functions
* Arrays

### NumPy

The project demonstrates:

* NumPy arrays
* Array operations
* Aggregation
* Mean
* Median
* Minimum and maximum
* Standard deviation
* Numerical data processing

### Web Development

It also demonstrates:

* React
* Next.js App Router
* TypeScript
* REST APIs
* Database integration
* Data visualization
* Responsive UI
* Production deployment

---

## 🔐 Security

The application follows basic security practices:

* Supabase service-role credentials remain server-side.
* Secret environment variables are not committed to Git.
* API routes validate incoming parameters.
* External API responses are handled through typed application logic.

---

## 📊 Project Status

**Status: Deployed 🚀**

The application is currently available as a live web application and includes:

* ✅ Weather location search
* ✅ Current weather
* ✅ Historical weather
* ✅ Data visualization
* ✅ Statistical analysis
* ✅ Python + NumPy educational section
* ✅ Supabase integration
* ✅ Responsive dashboard
* ✅ Vercel deployment
* ✅ Vercel Web Analytics

---

## 👨‍💻 Built By

**Muhammad Shakir**

BS Information Technology Student
Pakistan

---

## 📄 License

This project is intended primarily as an educational and student project.

You are welcome to explore the code and learn from the implementation.
