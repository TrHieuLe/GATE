/**
 * CẤU HÌNH API KEY THỜI TIẾT
 */
const OPENWEATHER_API_KEY = "2dd8c8cdc0dcdd5b571aebf98db5bf52"; 

const HISTORY_KEY = 'smartGateHistory';
const CHART_KEY = 'smartGateChartData';
let isAutoMode = true;
let mainChartInstance = null;
let socket = null;

// --- BIẾN MỚI CHO LOGIC AI HỎI KỸ SƯ ---
let aiModalInstance = null; 
let pendingAction = null;   
let isProcessingAI = false; 

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateWeather('Hanoi');
    loadQuickLog();
    
    // Khởi tạo Modal
    const modalEl = document.getElementById('aiConfirmModal');
    if (modalEl) {
        aiModalInstance = new coreui.Modal(modalEl);
    }

    const btnConfirm = document.getElementById('btnConfirmAI');
    const btnReject = document.getElementById('btnRejectAI');
    if(btnConfirm) btnConfirm.addEventListener('click', confirmAIAction);
    if(btnReject) btnReject.addEventListener('click', rejectAIAction);

    setInterval(simulationLoop, 2000);
    
    setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        document.querySelectorAll('.cam-time').forEach(el => el.innerText = timeStr);
    }, 1000);
});

function simulationLoop() {
    const now = new Date().toLocaleTimeString('vi-VN');
    const waterLevel = Math.floor(Math.random() * (95 - 40) + 40);
    document.getElementById('valWater').innerText = waterLevel + "%";
    updateChart(now, waterLevel);

    // Tạo giá trị pH và hiển thị
    const phValue = (Math.random() * (8.5 - 6.5) + 6.5).toFixed(1);
    document.getElementById('valPH').innerText = phValue;
    
    // Các chỉ số khác
    document.getElementById('valTurbidity').innerText = Math.floor(Math.random() * (30 - 10) + 10);
    document.getElementById('valTemp').innerText = (Math.random() * (30 - 25) + 25).toFixed(1); 
    document.getElementById('valDO').innerText = (Math.random() * (7.5 - 5.5) + 5.5).toFixed(1);

    // --- LOGIC AI MỚI ---
    if (isAutoMode) {
        const gateLabel = document.getElementById('valGate');
        const currentStatus = gateLabel.innerText; 

        if (isProcessingAI) return;

        // Logic MỞ (Xả lũ)
        if (waterLevel > 85) {
            if (!currentStatus.includes("MỞ")) {
                // Truyền null cho phValue vì xả lũ không cần bằng chứng mặn
                triggerAIProposal("OPEN", waterLevel, "MỞ CỔNG XẢ LŨ", null);
            }
        } 
        // Logic ĐÓNG (Ngăn mặn)
        else if (waterLevel < 50) {
            if (!currentStatus.includes("ĐÓNG")) {
                // Truyền giá trị pH vào để làm bằng chứng
                triggerAIProposal("CLOSE", waterLevel, "ĐÓNG CỔNG NGĂN MẶN", phValue);
            }
        }
    }
}

// --- HÀM XỬ LÝ AI ĐỀ XUẤT (CẬP NHẬT THÊM PH) ---
function triggerAIProposal(action, waterLevel, actionText, phValue) {
    if (!aiModalInstance) return;

    isProcessingAI = true;
    pendingAction = action;

    document.getElementById('modalWaterLevel').innerText = waterLevel + "%";
    document.getElementById('modalActionDesc').innerText = `Hành động đề xuất: ${actionText}`;
    
    const descEl = document.getElementById('modalActionDesc');
    const evidenceEl = document.getElementById('modalEvidence');
    const phEl = document.getElementById('modalPHValue');

    if(action === 'OPEN') {
        // Xả lũ: Chữ đỏ, ẨN bằng chứng pH
        descEl.className = "fs-5 fw-bold text-danger";
        evidenceEl.classList.add('d-none');
        evidenceEl.classList.remove('d-flex');
    } 
    else {
        // Ngăn mặn: Chữ xanh, HIỆN bằng chứng pH
        descEl.className = "fs-5 fw-bold text-success";
        // Cập nhật giá trị pH vào modal
        phEl.innerText = phValue || "--";
        // Hiện box
        evidenceEl.classList.remove('d-none');
        evidenceEl.classList.add('d-flex');
    }

    aiModalInstance.show();
}

function confirmAIAction() {
    const gateLabel = document.getElementById('valGate');
    
    if (pendingAction === 'OPEN') {
        gateLabel.innerText = "MỞ (AI)";
        gateLabel.className = "fs-4 fw-bold text-danger";
        saveToHistory("AI System", "Kỹ sư DUYỆT mở cổng", "Nguy hiểm");
    } else if (pendingAction === 'CLOSE') {
        gateLabel.innerText = "ĐÓNG (AI)";
        gateLabel.className = "fs-4 fw-bold text-success";
        saveToHistory("AI System", "Kỹ sư DUYỆT đóng cổng", "Không");
    }

    isProcessingAI = false; 
    pendingAction = null;
    aiModalInstance.hide();
}

function rejectAIAction() {
    saveToHistory("AI System", "Kỹ sư TỪ CHỐI đề xuất", "Cảnh báo");
    isProcessingAI = false; 
    pendingAction = null;
    aiModalInstance.hide();
}

// --- CÁC HÀM CŨ GIỮ NGUYÊN ---
function saveToHistory(type, action, alertLevel) {
    const newItem = {
        id: Date.now(), 
        time: new Date().toLocaleString('vi-VN'), 
        type: type,
        camera: type === 'Snapshot' ? 'Camera 1' : 'Hệ thống', 
        action: action,
        water: document.getElementById('valWater').innerText,
        gate: document.getElementById('valGate').innerText, 
        alert: alertLevel
    };
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.unshift(newItem);
    if (history.length > 100) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadQuickLog();
}

function loadQuickLog() {
    const list = document.getElementById('logList');
    if (!list) return;
    list.innerHTML = ''; 
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    const recentLogs = history.slice(0, 12); 
    if (recentLogs.length === 0) {
        list.innerHTML = '<li class="list-group-item text-muted text-center small">Chưa có dữ liệu...</li>';
        return;
    }
    recentLogs.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action p-2';
        let textColor = 'text-dark';
        if(item.alert === 'Cảnh báo') textColor = 'text-warning';
        if(item.alert === 'Nguy hiểm') textColor = 'text-danger fw-bold';
        li.innerHTML = `<div class="d-flex justify-content-between align-items-center"><span class="${textColor} small fw-bold">${item.action}</span><small class="text-muted" style="font-size:0.7rem">${item.time.split(' ')[1]}</small></div>`;
        list.appendChild(li);
    });
}

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(50, 31, 219, 0.5)'); 
    gradient.addColorStop(1, 'rgba(50, 31, 219, 0.0)');
    
    let savedData = JSON.parse(localStorage.getItem(CHART_KEY));
    let initialLabels = savedData ? savedData.labels : [];
    let initialData = savedData ? savedData.data : [];
    
    mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: initialLabels, 
            datasets: [{ 
                label: 'Mực nước (%)', 
                data: initialData, 
                borderColor: '#321fdb', 
                backgroundColor: gradient, 
                borderWidth: 2, 
                pointRadius: 3, 
                fill: true, 
                tension: 0.4 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
                y: { beginAtZero: true, max: 100, grid: { color: '#f0f2f5' } }, 
                x: { grid: { display: false } } 
            } 
        }
    });

    const ctxMini = document.getElementById('chartWaterMini');
    if(ctxMini) {
        new Chart(ctxMini.getContext('2d'), { 
            type: 'line', 
            data: { labels:[1,2,3,4,5], datasets:[{data:[60,70,80,65,75], borderColor:'white', borderWidth:2, pointRadius:0, tension:0.4}] }, 
            options: { plugins:{legend:false}, scales:{x:{display:false}, y:{display:false}}, maintainAspectRatio:false } 
        });
    }
}

function updateChart(label, value) { 
    if (!mainChartInstance) return; 
    if (mainChartInstance.data.labels.length > 30) { 
        mainChartInstance.data.labels.shift(); 
        mainChartInstance.data.datasets[0].data.shift(); 
    } 
    mainChartInstance.data.labels.push(label); 
    mainChartInstance.data.datasets[0].data.push(value); 
    mainChartInstance.update(); 
    localStorage.setItem(CHART_KEY, JSON.stringify({ labels: mainChartInstance.data.labels, data: mainChartInstance.data.datasets[0].data })); 
}

function resetChartData() { 
    if(confirm("Xóa dữ liệu biểu đồ?")) { 
        localStorage.removeItem(CHART_KEY); 
        mainChartInstance.data.labels = []; 
        mainChartInstance.data.datasets[0].data = []; 
        mainChartInstance.update(); 
    } 
}

function toggleMode() { 
    isAutoMode = !isAutoMode; 
    const btnText = document.getElementById('modeBtnText'); 
    const badge = document.getElementById('modeBadge'); 
    const btnOpen = document.getElementById('btnOpenGate'); 
    const btnClose = document.getElementById('btnCloseGate'); 
    
    if (isAutoMode) { 
        btnText.innerText = "Chế độ: TỰ ĐỘNG"; 
        badge.innerText = "AUTO"; 
        badge.className = "badge bg-success rounded-pill"; 
        btnOpen.disabled = true; 
        btnClose.disabled = true; 
        saveToHistory("System", "Chuyển Tự động (Auto)", "Không"); 
    } else { 
        btnText.innerText = "Chế độ: THỦ CÔNG"; 
        badge.innerText = "MANUAL"; 
        badge.className = "badge bg-warning text-dark rounded-pill"; 
        btnOpen.disabled = false; 
        btnClose.disabled = false; 
        saveToHistory("System", "Chuyển Thủ công (Manual)", "Cảnh báo"); 
    } 
}

document.getElementById('btnOpenGate').addEventListener('click', () => { 
    if(isAutoMode) return; 
    document.getElementById('valGate').innerText = "MỞ (Manual)"; 
    document.getElementById('valGate').className = "fs-4 fw-bold text-primary"; 
    saveToHistory("Control", "Người dùng MỞ cổng", "Cảnh báo"); 
});

document.getElementById('btnCloseGate').addEventListener('click', () => { 
    if(isAutoMode) return; 
    document.getElementById('valGate').innerText = "ĐÓNG (Manual)"; 
    document.getElementById('valGate').className = "fs-4 fw-bold"; 
    saveToHistory("Control", "Người dùng ĐÓNG cổng", "Không"); 
});

document.getElementById('wBtn').addEventListener('click', () => {
    const cityInput = document.getElementById('wInput').value;
    updateWeather(cityInput);
});

async function updateWeather(cityInput) {
    const city = cityInput || "Hanoi";
    const card = document.getElementById('weatherCard');
    
    if (OPENWEATHER_API_KEY === "HAY_DIEN_API_KEY_CUA_BAN_VAO_DAY" || OPENWEATHER_API_KEY === "") {
        document.getElementById('wDesc').innerText = "Thiếu API Key";
        alert("Vui lòng mở file main.js và điền API Key của bạn vào dòng đầu tiên!");
        return;
    }

    if(card) card.classList.add('loading-blur');

    try {
        const urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
        const resCurrent = await fetch(urlCurrent);
        const dataCurrent = await resCurrent.json();

        if (dataCurrent.cod !== 200) {
            throw new Error(dataCurrent.message || "Không tìm thấy thành phố");
        }

        document.getElementById('wTemp').innerText = Math.round(dataCurrent.main.temp) + "°C";
        document.getElementById('wLoc').innerText = dataCurrent.name;
        const desc = dataCurrent.weather[0].description;
        document.getElementById('wDesc').innerText = desc.charAt(0).toUpperCase() + desc.slice(1);
        
        const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
        const resForecast = await fetch(urlForecast);
        const dataForecast = await resForecast.json();

        const forecastDiv = document.getElementById('wForecast');
        forecastDiv.innerHTML = '';
        
        const dailyData = [];
        const usedDates = new Set();
        
        for(let item of dataForecast.list) {
            const dateText = item.dt_txt.split(' ')[0]; 
            if(!usedDates.has(dateText)) {
                if(item.dt_txt.includes("12:00:00")) {
                    dailyData.push(item);
                    usedDates.add(dateText);
                }
            }
        }

        const days = ['CN','T2','T3','T4','T5','T6','T7'];

        dailyData.slice(0, 5).forEach(item => {
            let d = new Date(item.dt * 1000);
            let dayName = days[d.getDay()];
            let t = Math.round(item.main.temp);
            let hum = item.main.humidity;
            let cond = item.weather[0].description; 
            let icon = item.weather[0].icon;

            let div = document.createElement('div');
            div.className = 'weather-card-day text-center flex-fill p-2';
            div.innerHTML = `
                <div class="fw-bold small text-secondary">${dayName}</div>
                <img src="https://openweathermap.org/img/wn/${icon}.png" width="32">
                <div class="fw-bold text-dark">${t}°</div>
                <div class="text-muted" style="font-size:0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; margin: 0 auto;" title="${cond}">${cond}</div>
                <div class="text-primary" style="font-size:0.65rem"><i class="cil-drop"></i> ${hum}%</div>
            `;
            forecastDiv.appendChild(div);
        });

    } catch (error) {
        console.error("Lỗi thời tiết:", error);
        alert("Lỗi tải thời tiết: " + error.message);
        document.getElementById('wLoc').innerText = "Lỗi kết nối";
    } finally {
        if(card) card.classList.remove('loading-blur');
    }
}

document.getElementById('btnWsConnect').addEventListener('click', () => {
    const btn = document.getElementById('btnWsConnect'); 
    const status = document.getElementById('wsBadge');
    if(socket) { socket.close(); return; }
    
    btn.innerText = "..."; 
    btn.disabled = true;
    
    try {
        socket = new WebSocket(document.getElementById('wsUrl').value);
        socket.onopen = () => { 
            status.innerText = "Connected"; 
            status.className = "badge bg-success"; 
            btn.innerText = "Disconnect"; 
            btn.className = "btn btn-danger"; 
            btn.disabled = false; 
            document.getElementById('serverStatus').innerText = "Online"; 
            document.getElementById('serverStatus').className = "text-success fw-bold"; 
            saveToHistory("System", "WS Connected", "Không"); 
        };
        socket.onclose = () => { 
            status.innerText = "Disconnected"; 
            status.className = "badge bg-secondary"; 
            btn.innerText = "Connect"; 
            btn.className = "btn btn-primary"; 
            btn.disabled = false; 
            document.getElementById('serverStatus').innerText = "Offline"; 
            document.getElementById('serverStatus').className = "text-danger fw-bold"; 
            saveToHistory("System", "WS Disconnected", "Cảnh báo"); 
            socket = null; 
        };
        socket.onerror = (err) => {
            console.error("WS Error", err);
            socket.close();
        };
    } catch(e) { 
        btn.disabled = false; 
        btn.innerText = "Connect"; 
        alert("URL WebSocket không hợp lệ"); 
    }
});