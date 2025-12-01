// --- CẤU HÌNH CHUNG (PHẢI KHỚP VỚI INDEX.HTML) ---
    const HISTORY_KEY = 'smartGateHistory';
    let historyData = [];

    document.addEventListener('DOMContentLoaded', () => {
        loadData(); // Load lần đầu
        
        // Tự động cập nhật mỗi 2 giây (Polling)
        setInterval(() => {
            // Chỉ cập nhật nếu người dùng KHÔNG đang tìm kiếm (để tránh nhảy dữ liệu khi đang gõ)
            if (document.getElementById('searchInput').value === '') {
                loadData();
            }
        }, 2000);
    });

    // 1. Hàm Đọc dữ liệu từ LocalStorage
    function loadData() {
        const json = localStorage.getItem(HISTORY_KEY);
        if (json) {
            const newData = JSON.parse(json);
            // So sánh sơ bộ để tránh render lại nếu không có gì thay đổi (tối ưu hiệu năng)
            if (JSON.stringify(newData) !== JSON.stringify(historyData)) {
                historyData = newData;
                renderTable();
            }
        } else {
            historyData = [];
            renderTable();
        }
    }

    // 2. Hàm Render Bảng
    function renderTable() {
        const tbody = document.getElementById('historyTableBody');
        const filterText = document.getElementById('searchInput').value.toLowerCase();
        const emptyState = document.getElementById('emptyState');
        
        tbody.innerHTML = '';

        // Lọc dữ liệu
        const filtered = historyData.filter(item => {
            const str = `${item.time} ${item.type} ${item.action} ${item.gate} ${item.alert}`.toLowerCase();
            return str.includes(filterText);
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('d-none');
        } else {
            emptyState.classList.add('d-none');
            
            filtered.forEach(item => {
                const tr = document.createElement('tr');
                
                // Xử lý Badge màu sắc
                let alertBadge = '';
                if (item.alert === 'Nguy hiểm') alertBadge = '<span class="badge bg-danger badge-status">NGUY HIỂM</span>';
                else if (item.alert === 'Cảnh báo') alertBadge = '<span class="badge bg-warning text-dark badge-status">CẢNH BÁO</span>';
                else alertBadge = '<span class="badge bg-success badge-status">ỔN ĐỊNH</span>';

                let gateBadge = item.gate.includes('MỞ') 
                    ? '<span class="fw-bold text-danger">MỞ</span>' 
                    : '<span class="fw-bold text-primary">ĐÓNG</span>';

                tr.innerHTML = `
                    <td class="ps-3 text-nowrap font-monospace small">${item.time}</td>
                    <td><span class="badge bg-secondary bg-opacity-25 text-dark border">${item.type}</span></td>
                    <td class="fw-semibold">${item.action}</td>
                    <td class="text-center text-primary fw-bold">${item.water}</td>
                    <td class="text-center">${gateBadge}</td>
                    <td class="text-center">${alertBadge}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-ghost-danger" onclick="deleteItem(${item.id})" title="Xóa dòng này">
                            <i class="cil-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // 3. Chức năng Tìm kiếm
    document.getElementById('searchInput').addEventListener('input', renderTable);

    // 4. Chức năng Xóa 1 dòng
    function deleteItem(id) {
        if(confirm("Bạn có chắc muốn xóa dòng nhật ký này?")) {
            historyData = historyData.filter(item => item.id !== id);
            saveAndRender();
        }
    }

    // 5. Chức năng Xóa Hết
    function clearAllHistory() {
        if(confirm("CẢNH BÁO: Hành động này sẽ xóa toàn bộ lịch sử!\nBạn có chắc chắn không?")) {
            historyData = [];
            saveAndRender();
        }
    }

    // Helper: Lưu lại vào LocalStorage sau khi xóa
    function saveAndRender() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
        renderTable();
    }

    // 6. Chức năng Xuất CSV
    function downloadCSV() {
        if (historyData.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        // BOM cho Excel đọc được tiếng Việt
        let csvContent = "\uFEFF"; 
        csvContent += "Time,Type,Action,Water Level,Gate Status,Alert Level\n";

        historyData.forEach(row => {
            // Escape dấu phẩy nếu có trong nội dung
            const cleanAction = row.action.replace(/,/g, " "); 
            csvContent += `${row.time},${row.type},${cleanAction},${row.water},${row.gate},${row.alert}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Log_SmartGate_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }