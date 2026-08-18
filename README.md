**AI-Powered Industrial Digital Twin with Autonomous Factory Management Agent**

 **A virtual factory that thinks, predicts, and manages itself.**

📌 Project Overview

The **AI-Powered Industrial Digital Twin** is a smart factory monitoring and management system that creates a virtual representation of physical machines and factory conditions.

The system collects real-time data from sensors connected to an ESP32, sends the data through Wi-Fi to a FastAPI backend, stores it in a MySQL database, and uses **Machine Learning and AI** to analyze machine conditions, predict possible faults, and support intelligent factory management.

** System Architecture**

ESP32 → Wi-Fi → FastAPI → MySQL → Machine Learning → Digital Twin Dashboard → AI Factory Manager
🎯 Objectives

* Monitor industrial machines in real time.
* Collect temperature, humidity, vibration, current, and smoke data.
* Store sensor data in a structured database.
* Create a virtual representation of factory machines.
* Detect abnormal machine conditions.
* Predict possible machine failures using Machine Learning.
* Provide a visual dashboard for factory monitoring.
* Develop an AI-based Factory Management Agent for intelligent decision-making.

🏭 Key Features

1. Real-Time Machine Monitoring

The ESP32 collects data from different sensors attached to the physical machine.

The monitored parameters include:

* 🌡️ Temperature
* 💧 Humidity
* 📳 Vibration
* ⚡ Current
* 🔥 Smoke

2. Industrial Digital Twin

A virtual representation of the physical factory is created using the collected sensor data.

The Digital Twin can display:

* Machine status
* Sensor readings
* Machine health
* Abnormal conditions
* Historical sensor data
* Predicted machine conditions


3. Machine Health Monitoring

Sensor values are analyzed to determine the condition of the machine.

Example:

text
Normal Condition
      ↓
Sensor Data Collection
      ↓
Data Analysis
      ↓
Machine Health Status
      ↓
Normal / Warning / Critical

4. Predictive Maintenance

Machine Learning can be used to analyze historical sensor data and identify patterns associated with machine faults.

For example:

text
Increasing Vibration
        +
Increasing Current
        ↓
Possible Machine Abnormality
        ↓
Maintenance Recommendation

The goal is to identify potential problems before an actual machine failure occurs.

5. AI Factory Manager

The AI Factory Manager acts as an intelligent decision-making layer.

It can analyze machine and environmental information and provide recommendations such as:

* Machine requires inspection.
* Vibration level is abnormal.
* Temperature is increasing.
* Machine may require maintenance.
* Factory condition requires attention.

🔌 Hardware Components

ESP32

The ESP32 acts as the main IoT controller.

Responsibilities:

* Read sensor values.
* Process sensor data.
* Connect to Wi-Fi.
* Send data to the FastAPI backend.

Sensors

| Sensor  | Parameter              | Purpose                      |
| ------- | ---------------------- | ---------------------------- |
| DHT22   | Temperature & Humidity | Environmental monitoring     |
| MPU6050 | Vibration              | Machine vibration monitoring |
| ACS712  | Current                | Machine current monitoring   |
| MQ-2    | Smoke                  | Smoke/fire indication        |



💻 Software Technologies

| Technology                   | Purpose                    |
| ---------------------------- | -------------------------- |
| ESP32                        | Sensor data acquisition    |
| Arduino IDE                  | ESP32 programming          |
| Python                       | Backend and ML development |
| FastAPI                      | REST API backend           |
| MySQL                        | Sensor data storage        |
| SQLAlchemy / MySQL Connector | Database connectivity      |
| Pydantic                     | Data validation            |
| Machine Learning             | Fault prediction           |
| HTML                         | Dashboard structure        |
| CSS                          | Dashboard styling          |
| JavaScript                   | Dashboard functionality    |
| Chart.js                     | Sensor data visualization  |

🔄 Data Flow

The complete data flow of the project is:

text
Physical Machine
      ↓
Sensors
      ↓
ESP32
      ↓
Wi-Fi
      ↓
FastAPI Backend
      ↓
MySQL Database
      ↓
Machine Learning
      ↓
Digital Twin Dashboard
      ↓
AI Factory Manager
      ↓
Prediction / Alert / Recommendation

Step-by-Step Data Transfer

**Step 1 — Sensor Measurement**

Sensors attached to the physical machine measure parameters such as temperature, humidity, vibration, current, and smoke.

**Step 2 — ESP32 Data Collection**

The ESP32 reads the sensor values.

**Step 3 — Wi-Fi Communication**

The ESP32 connects to the local Wi-Fi network and sends the collected data to the FastAPI server.

**Step 4 — FastAPI Backend**

FastAPI receives the sensor data through REST API endpoints.

**Step 5 — MySQL Database**

The received sensor data is stored in the MySQL database.

**Step 6 — Machine Learning**

Historical and real-time data can be analyzed by Machine Learning models to identify abnormal patterns and predict possible failures.

**Step 7 — Digital Twin Dashboard**

The dashboard displays the current condition of the physical machine in its virtual representation.

**Step 8 — AI Factory Manager**

The AI layer analyzes the available information and provides intelligent recommendations for factory management and maintenance.


🗄️ Database

The project uses **MySQL** for storing machine and sensor information.

Machines Table

The `machines` table stores information about the machines in the factory.

Example fields:

text
id
machine_name
status


Sensor Data Table

The `sensor_data` table stores sensor measurements.

Example fields:

text
id
machine_id
temperature
humidity
vibration
current
smoke
timestamp

Each sensor record is associated with a particular machine using `machine_id`.
⚡ FastAPI Backend

The backend provides REST API endpoints for communication between the ESP32, database, Machine Learning components, and dashboard.

Example endpoints:

text
GET  /
GET  /health
GET  /db-test

POST /machines
GET  /machines

POST /sensor-data
GET  /sensor-data

API Documentation

FastAPI automatically provides interactive API documentation through Swagger UI.

When the backend is running, open:

```text
http://127.0.0.1:8000/docs
```

This can be used to test the API endpoints and send sample requests.


🚀 How to Run the Backend

### 1. Clone the Repository

```bash
git clone https://github.com/Manisha-2006/industrial_digital_twin.git
```

```bash
cd industrial_digital_twin
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

For Windows:

```bash
venv\Scripts\activate
```

### 4. Install Required Packages

```bash
pip install fastapi uvicorn mysql-connector-python sqlalchemy pydantic pymysql
```

### 5. Configure MySQL

Create the required MySQL database and configure the database connection in the backend.

> **Security:** Never upload your MySQL password or other credentials to GitHub. Store sensitive information in environment variables such as a `.env` file and add `.env` to `.gitignore`.

### 6. Start FastAPI

From the backend directory:

```bash
uvicorn main:app --reload
```

The API will normally be available at:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

📁 Project Structure

```text
industrial_digital_twin/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── routes/
│
├── ml/
│   └── machine_learning_models/
│
├── dashboard/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🤖 Machine Learning Module

The Machine Learning module is intended to analyze sensor data and identify abnormal machine behavior.

Potential inputs include:

```text
Temperature
Humidity
Vibration
Current
Smoke
```

Possible outputs include:

```text
Normal
Warning
Critical
```

The ML model can be improved as more machine sensor data is collected.

---

## 📊 Digital Twin Dashboard

The dashboard provides a visual representation of the factory.

It can display:

* Factory machines
* Machine operating status
* Real-time sensor values
* Historical sensor graphs
* Machine health
* Warning conditions
* Predictive maintenance information

Charts can be implemented using **Chart.js**.

---

## 🧠 AI Factory Management

The AI Factory Manager is designed to convert machine data into useful decisions.

Example:

text
Sensor Data
     ↓
Data Analysis
     ↓
Abnormal Pattern Detected
     ↓
AI Factory Manager
     ↓
Maintenance Recommendation


This helps move the system from simple monitoring toward intelligent factory management.

---

## 🔮 Future Enhancements

Future versions of the project can include:

* Real-time 3D Digital Twin visualization.
* Improved Machine Learning models.
* Automatic fault classification.
* Predictive maintenance scheduling.
* More industrial machines.
* Automated control commands.
* Advanced AI Factory Manager capabilities.
* Historical performance analytics.
* Factory-wide health monitoring.
* More advanced visualization and reporting.

🎓 Project Domain

**Internet of Things (IoT)**
**Industrial IoT (IIoT)**
**Industry 4.0** 
**Digital Twin**
**Machine Learning**
**Artificial Intelligence**
**Predictive Maintenance**
**Smart Manufacturing**

👩‍💻 Project Author
Manisha M A

B.E. Electronics and Communication Engineering

⭐ Project Vision

To build a smart virtual factory that can monitor machines, understand their condition, predict possible failures, and assist in making intelligent factory management decisions.
