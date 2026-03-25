# DataLens — Intelligent MERN Data Analytics Platform

DataLens is a powerful, full-stack data analytics application designed to turn messy CSV files into actionable insights instantly. Built with the MERN stack (MongoDB, Express, React, Node.js), it features an automated cleaning engine, dynamic visualizations, and professional PDF report generation.

![Header](https://via.placeholder.com/1200x400/0a0a1a/6c5ce7?text=DataLens+Analytics+Dashboard)

## 🚀 Key Features

- **🧹 Auto-Cleaning Engine**: Automatically detects and removes `null`, `NaN`, and duplicate values. Trims whitespace and handles inconsistent formatting.
- **📊 Smart Visualizations**: Dynamic chart generation using Recharts. Auto-detects numeric vs categorical data to provide the best visual context (Bar, Area, and Pie charts).
- **📚 Analysis History**: Every upload is stored in MongoDB, allowing users to recall past insights and compare performance metrics over time.
- **📄 Professional PDF Reports**: One-click export for comprehensive summaries, including cleaning statistics, column distributions, and data snapshots.
- **✨ Premium UI/UX**: Modern dark-mode interface with glassmorphism, smooth animations, and a fully responsive design.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, React Router, Axios, React Dropzone, Vanilla CSS |
| **Backend** | Node.js, Express, Multer (File Handling), PapaParse (CSV Processing) |
| **Database** | MongoDB, Mongoose (Metadata & Statistics Storage) |
| **Reporting** | jsPDF, jsPDF-AutoTable |

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or via Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/mustafasafdar1/analytix-hub.git
cd analytix-hub
```

### 2. Backend Setup
```bash
cd server
npm install
# Create a .env file with:
# PORT=5000
# MONGODB_URI=mongodb://localhost:2017/datalens
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 📈 Architecture Overview

DataLens follows a traditional Client-Server architecture:
1. **Upload Layer**: Multer handles multipart file streaming.
2. **Processing Layer**: Custom cleaning utility parses data and computes multi-dimensional statistics.
3. **Persistence Layer**: Results are stored in MongoDB as structured analysis objects.
4. **Visualization Layer**: React frontend reconstructs trends and distributions via Recharts.

---

Built with ❤️ by [Mustafa Safdar](https://github.com/mustafasafdar1)
