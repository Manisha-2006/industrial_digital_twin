/**
 * ============================================================================
 * AI-POWERED INDUSTRIAL DIGITAL TWIN - SCADA CONTROL CENTER ENGINE
 * ============================================================================
 */

// API Base URL Configuration
const API_BASE_URL = "http://127.0.0.1:8000";

// Automatic Polling Interval
const POLL_INTERVAL_MS = 5000;

// Configurable Thresholds for Sensor Status Logic
const THRESHOLDS = {
    temperature: {
        warning: 40,
        critical: 60,
        unit: "°C"
    },

    humidity: {
        minNormal: 30,
        maxNormal: 70,
        warningHigh: 85,
        unit: "%"
    },

    vibration: {
        warning: 3,
        critical: 5,
        unit: "mm/s"
    },

    current: {
        warning: 5,
        critical: 8,
        unit: "A"
    },

    smoke: {
        warning: 100,
        critical: 200,
        unit: "ppm"
    },

    // ADDED
    voltage: {
        minNormal: 10,
        maxNormal: 14,
        warningLow: 9,
        warningHigh: 15,
        unit: "V"
    },

    // ADDED
    power: {
        warning: 100,
        critical: 200,
        unit: "W"
    }
};


/* ============================================================================
   VOLTAGE AND POWER HELPERS
   ============================================================================ */

// Get voltage from API data
function getVoltage(data) {

    if (!data) {
        return null;
    }

    if (
        data.voltage !== undefined &&
        data.voltage !== null &&
        data.voltage !== ""
    ) {
        const voltage = Number(data.voltage);

        if (!Number.isNaN(voltage)) {
            return voltage;
        }
    }

    return null;
}


// Get power from API data
function getPower(data) {

    if (!data) {
        return null;
    }

    // If power is already stored in MySQL, use it
    if (
        data.power !== undefined &&
        data.power !== null &&
        data.power !== ""
    ) {
        const power = Number(data.power);

        if (!Number.isNaN(power)) {
            return power;
        }
    }

    // Otherwise calculate power using:
    // Power = Voltage × Current
    const voltage = getVoltage(data);

    if (
        voltage !== null &&
        data.current !== undefined &&
        data.current !== null
    ) {

        const current = Number(data.current);

        if (!Number.isNaN(current)) {
            return Number((voltage * current).toFixed(2));
        }
    }

    return null;
}


// Global Dashboard State Store
const state = {
    isBackendOnline: false,
    machines: [],
    sensorData: [],
    latestDataPoint: null,
    machineHealthMap: {},
    charts: {},
    selectedMachine: null
};


// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {

    console.log("Industrial Digital Twin initializing...");

    const apiUrlDisplay =
        document.getElementById("api-url-display");

    if (apiUrlDisplay) {
        apiUrlDisplay.textContent = API_BASE_URL;
    }

    initCharts();

    setupEventListeners();

    pollFactoryData();

    setInterval(
        pollFactoryData,
        POLL_INTERVAL_MS
    );
});
/* ============================================================================
   1. API DATA FETCHING & POLLING ENGINE
   ============================================================================ */
async function pollFactoryData() {
    // 1. Check Backend Health Endpoint
    const isHealthy = await checkBackendHealth();

    if (!isHealthy) {
        setOfflineState();
        return;
    }

    setOnlineState();

    // 2. Fetch Machines & Sensor Data in Parallel
    try {
        const [machinesRes, sensorDataRes] = await Promise.all([
            fetch(`${API_BASE_URL}/machines`),
            fetch(`${API_BASE_URL}/sensor-data`)
        ]);

        if (machinesRes.ok && sensorDataRes.ok) {
            state.machines = await machinesRes.json();
            state.sensorData = await sensorDataRes.json();

            // Extract latest sensor record if available
            if (state.sensorData && state.sensorData.length > 0) {
                state.latestDataPoint = state.sensorData[state.sensorData.length - 1];
            } else {
                state.latestDataPoint = null;
            }

            // Process Data & Re-render Components
            processTelemetryData();
            updateLastUpdatedTime();
        } else {
            console.error("API response error:", machinesRes.status, sensorDataRes.status);
        }
    } catch (err) {
        console.error("Error fetching factory telematics:", err);
    }
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
        if (response.ok) {
            const data = await response.json();
            return data.status === "healthy" || response.status === 200;
        }
        return false;
    } catch (err) {
        return false;
    }
}

/* ============================================================================
   2. UI STATE UPDATERS (ONLINE / OFFLINE / TIMESTAMPS)
   ============================================================================ */
function setOnlineState() {
    state.isBackendOnline = true;

    // Update Status Pill
    const statusPill = document.getElementById("system-status-pill");
    const statusText = document.getElementById("system-status-text");
    if (statusPill && statusText) {
        statusPill.className = "status-pill online";
        statusText.textContent = "SYSTEM ONLINE";
    }

    // Update Connection Indicator
    const connStatusText = document.getElementById("conn-status-text");
    if (connStatusText) {
        connStatusText.textContent = "FastAPI Connected";
    }

    // Hide Backend Offline Alert Banner
    const banner = document.getElementById("backend-offline-banner");
    if (banner) banner.classList.add("hidden");
}

function setOfflineState() {
    state.isBackendOnline = false;

    // Update Status Pill
    const statusPill = document.getElementById("system-status-pill");
    const statusText = document.getElementById("system-status-text");
    if (statusPill && statusText) {
        statusPill.className = "status-pill offline";
        statusText.textContent = "BACKEND OFFLINE";
    }

    // Update Connection Indicator
    const connStatusText = document.getElementById("conn-status-text");
    if (connStatusText) {
        connStatusText.textContent = "FastAPI Offline";
    }

    // Show Backend Offline Alert Banner
    const banner = document.getElementById("backend-offline-banner");
    if (banner) banner.classList.remove("hidden");

    // Render empty state banners in machine list if empty
    const machinesContainer = document.getElementById("machines-container");
    if (machinesContainer && state.machines.length === 0) {
        machinesContainer.innerHTML = `
            <div class="empty-placeholder">
                <i class="fa-solid fa-plug-circle-xmark" style="font-size: 24px; color: var(--color-critical); margin-bottom: 8px;"></i>
                <br>
                <strong>Unable to connect to FastAPI server</strong>
                <p style="font-size: 12px; margin-top: 4px;">Make sure FastAPI is running on ${API_BASE_URL}</p>
            </div>
        `;
    }
}

function updateLastUpdatedTime() {
    const clockEl = document.getElementById("last-updated-time");
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toTimeString().split(" ")[0];
    }
}

/* ============================================================================
   3. SENSOR EVALUATION & MACHINE HEALTH LOGIC
   ============================================================================ */
function evaluateSensorStatus(metric, value) {
    if (value === null || value === undefined) return "normal";

    const cfg = THRESHOLDS[metric];
    if (!cfg) return "normal";

    if (metric === "humidity") {
        if (value > cfg.warningHigh) return "critical";
        if (value < cfg.minNormal || value > cfg.maxNormal) return "warning";
        return "normal";
    }

    if (metric === "voltage") {
        if (value < cfg.warningLow || value > cfg.warningHigh) return "critical";
        if (value < cfg.minNormal || value > cfg.maxNormal) return "warning";
        return "normal";
    }

    if (value >= cfg.critical) return "critical";
    if (value >= cfg.warning) return "warning";
    return "normal";
}

function processTelemetryData() {
    // 1. Calculate overall machine health map based on latest data
    state.machineHealthMap = {};

    state.machines.forEach(machine => {
        // Find latest sensor data for this machine, or fall back to state.latestDataPoint
        let latest = state.sensorData
            .filter(d => d.machine_id === machine.id)
            .pop();

        if (!latest && state.latestDataPoint) {
            latest = state.latestDataPoint;
        }

        let overallHealth = "normal";

        if (latest) {
            const tempStat = evaluateSensorStatus("temperature", latest.temperature);
            const humStat = evaluateSensorStatus("humidity", latest.humidity);
            const vibStat = evaluateSensorStatus("vibration", latest.vibration);
            const currStat = evaluateSensorStatus("current", latest.current);
            const smokeStat = evaluateSensorStatus("smoke", latest.smoke);

            const statuses = [tempStat, humStat, vibStat, currStat, smokeStat];
            if (statuses.includes("critical")) {
                overallHealth = "critical";
            } else if (statuses.includes("warning")) {
                overallHealth = "warning";
            }
        }

        state.machineHealthMap[machine.id] = {
            machine,
            latestData: latest,
            overallHealth
        };
    });

    // 2. Render Component Views
    renderOverviewCounters();
    renderMachineCards();
    renderSensorCards();
    updateCharts();
    renderDigitalTwin();
    renderAIFactoryManager();
    renderPredictiveMaintenance();
    renderActiveAlerts();
}

/* ============================================================================
   4. RENDER FACTORY OVERVIEW COUNTERS
   ============================================================================ */
function renderOverviewCounters() {
    const total = state.machines.length;
    let running = 0;
    let warning = 0;
    let critical = 0;

    Object.values(state.machineHealthMap).forEach(item => {
        if (item.overallHealth === "critical") critical++;
        else if (item.overallHealth === "warning") warning++;
        else running++;
    });

    document.getElementById("metric-total-machines").textContent = total;
    document.getElementById("metric-running-machines").textContent = running;
    document.getElementById("metric-warning-machines").textContent = warning;
    document.getElementById("metric-critical-machines").textContent = critical;
}

/* ============================================================================
   5. RENDER MACHINE OVERVIEW CARDS
   ============================================================================ */
function renderMachineCards() {
    const container = document.getElementById("machines-container");
    if (!container) return;

    if (state.machines.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; color: var(--color-warning); margin-bottom: 8px;"></i>
                <br>
                <strong>No machines registered</strong>
                <p style="font-size: 12px; margin-top: 4px;">Use POST /machines to register factory equipment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.machines.map(m => {
        const healthInfo = state.machineHealthMap[m.id] || { overallHealth: "normal", latestData: null };
        const data = healthInfo.latestData || {};
        const statusClass = healthInfo.overallHealth;

        const statusLabel = statusClass === "critical" ? "CRITICAL" : statusClass === "warning" ? "WARNING" : "RUNNING";

        return `
            <div class="machine-card" data-id="${m.id}">
                <div class="machine-card-header">
                    <div class="machine-title-group">
                        <i class="fa-solid ${m.machine_type.toLowerCase().includes('pump') ? 'fa-faucet-drip' : 'fa-gear'}"></i>
                        <div>
                            <div class="machine-name">${m.name.toUpperCase()}</div>
                            <div class="machine-type">${m.machine_type}</div>
                        </div>
                    </div>
                    <span class="machine-status-tag ${statusClass}">${statusLabel}</span>
                </div>

                <div class="machine-telemetry-list">
                    <div class="telemetry-row">
                        <span>Machine ID:</span>
                        <span class="val">#${m.id}</span>
                    </div>
                    <div class="telemetry-row">
                        <span>Voltage:</span>
                        <span class="val">${getVoltage(data) !== null ? getVoltage(data) + " V" : "--"}</span>
                    </div>
                    <div class="telemetry-row">
                        <span>Current:</span>
                        <span class="val">${data.current !== undefined && data.current !== null ? data.current + " A" : "--"}</span>
                    </div>
                    <div class="telemetry-row">
                        <span>Power:</span>
                        <span class="val">
    ${getPower(data) !== null ? getPower(data) + " W" : "--"}
</span>
                    </div>
                    <div class="telemetry-row">
                        <span>Temperature:</span>
                        <span class="val">${data.temperature !== undefined && data.temperature !== null ? data.temperature + " °C" : "--"}</span>
                    </div>
                    <div class="telemetry-row">
                        <span>Vibration:</span>
                        <span class="val">${data.vibration !== undefined && data.vibration !== null ? data.vibration + " mm/s" : "--"}</span>
                    </div>
                </div>

                <button class="btn-card-details" onclick="openMachineModal(${m.id})">
                    View Details <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
    }).join("");
}

/* ============================================================================
   6. RENDER REAL-TIME SENSOR MONITORING CARDS
   ============================================================================ */
function renderSensorCards() {

    const latest = state.latestDataPoint;

    updateSingleSensorCard(
        "temp",
        latest ? latest.temperature : null,
        "temperature",
        "°C"
    );

    updateSingleSensorCard(
        "hum",
        latest ? latest.humidity : null,
        "humidity",
        "%"
    );

    updateSingleSensorCard(
        "vib",
        latest ? latest.vibration : null,
        "vibration",
        "mm/s"
    );

    updateSingleSensorCard(
        "curr",
        latest ? latest.current : null,
        "current",
        "A"
    );

    updateSingleSensorCard(
        "smoke",
        latest ? latest.smoke : null,
        "smoke",
        "ppm"
    );

    updateSingleSensorCard(
        "volt",
        latest ? getVoltage(latest) : null,
        "voltage",
        "V"
    );

    updateSingleSensorCard(
        "power",
        latest ? getPower(latest) : null,
        "power",
        "W"
    );
}

function updateSingleSensorCard(idKey, val, metricKey, unit) {
    const valEl = document.getElementById(`sensor-val-${idKey}`);
    const statusEl = document.getElementById(`sensor-status-${idKey}`);
    const trendEl = document.getElementById(`sensor-trend-${idKey}`);

    if (val === null || val === undefined) {
        if (valEl) valEl.innerHTML = `No data`;
        if (statusEl) {
            statusEl.className = "status-badge normal";
            statusEl.textContent = "NO DATA";
        }
        if (trendEl) trendEl.innerHTML = `<i class="fa-solid fa-minus"></i> Offline`;
        return;
    }

    if (valEl) valEl.innerHTML = `${val} <span class="unit">${unit}</span>`;

    const status = evaluateSensorStatus(metricKey, val);
    if (statusEl) {
        statusEl.className = `status-badge ${status}`;
        statusEl.textContent = status.toUpperCase();
    }

    if (trendEl) {
        if (status === "critical") {
            trendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up" style="color: var(--color-critical)"></i> Exceeds limit`;
        } else if (status === "warning") {
            trendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up" style="color: var(--color-warning)"></i> Elevated`;
        } else {
            trendEl.innerHTML = `<i class="fa-solid fa-check" style="color: var(--color-normal)"></i> Optimal`;
        }
    }
}

/* ============================================================================
   7. LIVE CHART.JS TELEMETRY VISUALIZATION
   ============================================================================ */
function initCharts() {
    const chartConfigs = [
        { id: "chart-temperature", label: "Temperature (°C)", color: "#f97316", border: "#ea580c" },
        { id: "chart-humidity", label: "Humidity (%)", color: "#38bdf8", border: "#0284c7" },
        { id: "chart-vibration", label: "Vibration (mm/s)", color: "#a855f7", border: "#9333ea" },
        { id: "chart-current", label: "Current (A)", color: "#eab308", border: "#ca8a04" },
        { id: "chart-voltage", label: "Voltage (V)", color: "#6366f1", border: "#4f46e5" },
        { id: "chart-power", label: "Power (kW)", color: "#10b981", border: "#059669" },
        { id: "chart-smoke", label: "Smoke (ppm)", color: "#ef4444", border: "#dc2626" }
    ];

    chartConfigs.forEach(cfg => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx) return;

        state.charts[cfg.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: cfg.label,
                    data: [],
                    borderColor: cfg.color,
                    backgroundColor: hexToRgba(cfg.color, 0.15),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: cfg.color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#111827',
                        titleColor: '#f3f4f6',
                        bodyColor: cfg.color,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 10 } }
                    }
                }
            }
        });
    });
}

function updateCharts() {
    if (!state.sensorData || state.sensorData.length === 0) return;

    // Use last 15 readings for clean view
    const datasetSlice = state.sensorData.slice(-15);
    const labels = datasetSlice.map((d, idx) => {
        if (d.timestamp) {
            const dt = new Date(d.timestamp);
            return dt.toTimeString().split(" ")[0];
        }
        return `#${d.id || idx + 1}`;
    });

    updateChartData("chart-temperature", labels, datasetSlice.map(d => d.temperature));
    updateChartData("chart-humidity", labels, datasetSlice.map(d => d.humidity));
    updateChartData("chart-vibration", labels, datasetSlice.map(d => d.vibration));
    updateChartData("chart-current", labels, datasetSlice.map(d => d.current));
    updateChartData("chart-voltage", labels, datasetSlice.map(d => getVoltage(d)));
    updateChartData("chart-power", labels, datasetSlice.map(d => getPower(d)));
    updateChartData("chart-smoke", labels, datasetSlice.map(d => d.smoke));
}

function updateChartData(chartId, labels, dataPoints) {
    const chart = state.charts[chartId];
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = dataPoints;
        chart.update('none'); // Update smoothly without glitching
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ============================================================================
   8. DIGITAL TWIN 2D FACTORY FLOOR RENDERER
   ============================================================================ */
function renderDigitalTwin() {
    // Sync node glow and status badges for Motor 1 and Pump 1
    state.machines.forEach(m => {
        const healthInfo = state.machineHealthMap[m.id];
        if (!healthInfo) return;

        const health = healthInfo.overallHealth;
        const nameLower = m.name.toLowerCase();

        let nodeGlowEl = null;
        let nodeBadgeEl = null;

        if (nameLower.includes("motor")) {
            nodeGlowEl = document.getElementById("twin-glow-motor1");
            nodeBadgeEl = document.getElementById("twin-badge-motor1");
        } else if (nameLower.includes("pump")) {
            nodeGlowEl = document.getElementById("twin-glow-pump1");
            nodeBadgeEl = document.getElementById("twin-badge-pump1");
        }

        if (nodeGlowEl) {
            nodeGlowEl.className = `node-status-glow ${health}`;
        }
        if (nodeBadgeEl) {
            nodeBadgeEl.className = `status-pill-small ${health}`;
            nodeBadgeEl.textContent = health.toUpperCase();
        }
    });
}

/* ============================================================================
   9. AI FACTORY MANAGER INTELLIGENCE ENGINE
   ============================================================================ */
function renderAIFactoryManager() {
    const feedContainer = document.getElementById("ai-feed-container");
    if (!feedContainer) return;

    const latest = state.latestDataPoint;
    const messages = [];

    if (!latest) {
        messages.push({
            type: "info",
            icon: "fa-circle-info",
            text: "<strong>System Initialized:</strong> Awaiting telemetry package from FastAPI server..."
        });
    } else {
        // Evaluate smoke
        const smokeStat = evaluateSensorStatus("smoke", latest.smoke);
        if (smokeStat === "critical" || smokeStat === "warning") {
            messages.push({
                type: "critical",
                icon: "fa-triangle-exclamation",
                text: `<strong>Elevated Smoke Level (${latest.smoke} ppm):</strong> Potential thermal stress or friction detected. Recommend immediate site inspection.`
            });
        }

        // Evaluate temperature
        const tempStat = evaluateSensorStatus("temperature", latest.temperature);
        if (tempStat === "critical" || tempStat === "warning") {
            messages.push({
                type: "warning",
                icon: "fa-temperature-high",
                text: `<strong>High Motor Temperature (${latest.temperature} °C):</strong> Thermal index elevated. Check cooling system airflow.`
            });
        }

        // Evaluate vibration
        const vibStat = evaluateSensorStatus("vibration", latest.vibration);
        if (vibStat === "critical" || vibStat === "warning") {
            messages.push({
                type: "warning",
                icon: "fa-vroom",
                text: `<strong>Vibration Anomaly (${latest.vibration} mm/s):</strong> Mechanical unbalance detected. Schedule bearing vibration alignment.`
            });
        }

        // If all normal
        if (messages.length === 0) {
            messages.push({
                type: "info",
                icon: "fa-circle-check",
                text: "<strong>Factory Autonomous Intelligence:</strong> All machine units operating within optimal SCADA parameters. No anomaly predicted."
            });
        }
    }

    feedContainer.innerHTML = messages.map(msg => `
        <div class="ai-message-card ${msg.type}">
            <div class="msg-icon"><i class="fa-solid ${msg.icon}"></i></div>
            <div class="msg-text">${msg.text}</div>
        </div>
    `).join("");
}

/* ============================================================================
   10. PREDICTIVE MAINTENANCE HEALTH CALCULATOR
   ============================================================================ */
function renderPredictiveMaintenance() {
    const latest = state.latestDataPoint;
    let score = 100;
    let tempRisk = 10;
    let vibRisk = 10;
    let currRisk = 10;

    if (latest) {
        if (latest.temperature > 40) tempRisk = Math.min(100, Math.round((latest.temperature / 60) * 100));
        if (latest.vibration > 3) vibRisk = Math.min(100, Math.round((latest.vibration / 5) * 100));
        if (latest.current > 5) currRisk = Math.min(100, Math.round((latest.current / 8) * 100));

        const penalty = (tempRisk > 50 ? 25 : 0) + (vibRisk > 50 ? 25 : 0) + (currRisk > 50 ? 25 : 0);
        score = Math.max(0, 100 - penalty);
    }

    // Update Health Score UI
    const percentEl = document.getElementById("health-score-percent");
    const statusEl = document.getElementById("health-score-status");
    const ringEl = document.getElementById("health-score-ring");

    if (percentEl) percentEl.textContent = `${score}%`;
    if (statusEl) statusEl.textContent = score > 80 ? "Healthy" : score > 50 ? "Degraded" : "Action Req.";

    if (ringEl) {
        // 264 is perimeter of circle r=42
        const offset = 264 - (264 * (score / 100));
        ringEl.style.strokeDashoffset = offset;
        ringEl.style.stroke = score > 80 ? "var(--color-normal)" : score > 50 ? "var(--color-warning)" : "var(--color-critical)";
    }

    // Update Progress Fill Bars
    updateProgressBar("risk-temp-bar", tempRisk);
    updateProgressBar("risk-vib-bar", vibRisk);
    updateProgressBar("risk-curr-bar", currRisk);

    // Update Recommendation Text
    const recTextEl = document.getElementById("recommendation-text");
    if (recTextEl) {
        if (score < 60) {
            recTextEl.textContent = "Critical sensor escalation detected. Immediate inspection recommended based on elevated readings.";
        } else if (score < 85) {
            recTextEl.textContent = "Elevated sensor trend detected. Schedule routine maintenance check within 24 operational hours.";
        } else {
            recTextEl.textContent = "Machine operating within normal parameters. Continue standard operational telemetry monitoring.";
        }
    }
}

function updateProgressBar(id, percent) {
    const el = document.getElementById(id);
    if (el) {
        el.style.width = `${percent}%`;
        el.className = `progress-fill ${percent > 70 ? 'red' : percent > 40 ? 'amber' : 'green'}`;
    }
}

/* ============================================================================
   11. ACTIVE ALERTS FEED GENERATOR
   ============================================================================ */
function renderActiveAlerts() {
    const feedContainer = document.getElementById("alerts-feed-container");
    const alertCountBadge = document.getElementById("sidebar-alert-count");
    if (!feedContainer) return;

    const alerts = [];

    Object.values(state.machineHealthMap).forEach(item => {
        const m = item.machine;
        const d = item.latestData;

        if (!d) return;

        const smokeStat = evaluateSensorStatus("smoke", d.smoke);
        if (smokeStat !== "normal") {
            alerts.push({
                severity: smokeStat,
                title: `${smokeStat.toUpperCase()}: Smoke Level Elevated`,
                machine: m.name,
                detail: `Smoke: ${d.smoke} ppm`,
                time: new Date().toTimeString().split(" ")[0]
            });
        }

        const tempStat = evaluateSensorStatus("temperature", d.temperature);
        if (tempStat !== "normal") {
            alerts.push({
                severity: tempStat,
                title: `${tempStat.toUpperCase()}: High Temperature`,
                machine: m.name,
                detail: `Temperature: ${d.temperature} °C`,
                time: new Date().toTimeString().split(" ")[0]
            });
        }

        const vibStat = evaluateSensorStatus("vibration", d.vibration);
        if (vibStat !== "normal") {
            alerts.push({
                severity: vibStat,
                title: `${vibStat.toUpperCase()}: Vibration Anomaly`,
                machine: m.name,
                detail: `Vibration: ${d.vibration} mm/s`,
                time: new Date().toTimeString().split(" ")[0]
            });
        }
    });

    if (alertCountBadge) alertCountBadge.textContent = alerts.length;

    if (alerts.length === 0) {
        feedContainer.innerHTML = `
            <div class="alert-item normal">
                <i class="fa-solid fa-circle-check alert-icon"></i>
                <div class="alert-content">
                    <h4>No Active Alerts</h4>
                    <p>All connected machines operating within normal parameters.</p>
                </div>
                <span class="alert-time">Live</span>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = alerts.map(a => `
        <div class="alert-item ${a.severity}">
            <i class="fa-solid ${a.severity === 'critical' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'} alert-icon"></i>
            <div class="alert-content">
                <h4>${a.title}</h4>
                <p>Machine: <strong>${a.machine}</strong> | ${a.detail}</p>
            </div>
            <span class="alert-time">${a.time}</span>
        </div>
    `).join("");
}

/* ============================================================================
   12. INTERACTIVE MACHINE DETAILS MODAL
   ============================================================================ */
function openMachineModal(machineId) {
    const machine = state.machines.find(m => m.id === machineId);
    if (!machine) return;

    state.selectedMachine = machine;

    const healthInfo = state.machineHealthMap[machineId] || {};
    const data = healthInfo.latestData || {};
    const health = healthInfo.overallHealth || "normal";

    document.getElementById("modal-machine-name").textContent = machine.name.toUpperCase();
    document.getElementById("modal-machine-type").textContent = machine.machine_type;
    document.getElementById("modal-machine-id").textContent = `ID: #${machine.id}`;

    const banner = document.getElementById("modal-status-banner");
    const statusText = document.getElementById("modal-status-text");
    if (banner && statusText) {
        banner.className = `modal-status-banner ${health}`;
        statusText.textContent = health === "critical" ? "🔴 CRITICAL ALERT" : health === "warning" ? "🟡 WARNING STATE" : "🟢 OPERATIONAL";
    }

    document.getElementById("modal-val-temp").textContent = data.temperature !== undefined && data.temperature !== null ? `${data.temperature} °C` : "--";
    document.getElementById("modal-val-hum").textContent = data.humidity !== undefined && data.humidity !== null ? `${data.humidity} %` : "--";
    document.getElementById("modal-val-vib").textContent = data.vibration !== undefined && data.vibration !== null ? `${data.vibration} mm/s` : "--";
    document.getElementById("modal-val-curr").textContent = data.current !== undefined && data.current !== null ? `${data.current} A` : "--";
    document.getElementById("modal-val-volt").textContent = getVoltage(data) !== null ? `${getVoltage(data)} V` : "--";
    document.getElementById("modal-val-power").textContent = getPower(data) !== null ? `${getPower(data)} kW` : "--";
    document.getElementById("modal-val-smoke").textContent = data.smoke !== undefined && data.smoke !== null ? `${data.smoke} ppm` : "--";
    document.getElementById("modal-val-updated").textContent = new Date().toTimeString().split(" ")[0];

    const modal = document.getElementById("machine-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeMachineModal() {
    const modal = document.getElementById("machine-modal");
    if (modal) modal.classList.add("hidden");
}

/* ============================================================================
   13. EVENT LISTENERS & NAVIGATION
   ============================================================================ */
function setupEventListeners() {
    // Modal Close buttons
    const closeBtn = document.getElementById("modal-close-btn");
    const dismissBtn = document.getElementById("modal-dismiss-btn");
    const trendBtn = document.getElementById("modal-trend-btn");

    if (closeBtn) closeBtn.addEventListener("click", closeMachineModal);
    if (dismissBtn) dismissBtn.addEventListener("click", closeMachineModal);

    if (trendBtn) {
        trendBtn.addEventListener("click", () => {
            closeMachineModal();
            const chartsSection = document.getElementById("section-charts");
            if (chartsSection) chartsSection.scrollIntoView({ behavior: "smooth" });
        });
    }

    // Modal background overlay click
    const modalOverlay = document.getElementById("machine-modal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeMachineModal();
        });
    }

    // Digital Twin Node Click Listeners
    const twinMotor = document.getElementById("twin-node-motor1");
    const twinPump = document.getElementById("twin-node-pump1");

    if (twinMotor) twinMotor.addEventListener("click", () => openMachineModal(1));
    if (twinPump) twinPump.addEventListener("click", () => openMachineModal(2));

    // Sidebar smooth navigation
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const sectionTarget = item.getAttribute("data-section");
            if (sectionTarget) {
                const targetEl = document.getElementById(`section-${sectionTarget}`);
                if (targetEl) {
                    navItems.forEach(n => n.classList.remove("active"));
                    item.classList.add("active");
                    targetEl.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });
}
