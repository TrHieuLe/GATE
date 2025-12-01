// ============================================
    // STATE & DATA
    // ============================================
    let cameras = [];
    let snapshots = [];
    let alerts = [];
    let motionDetectionEnabled = false;
    let recordingCameras = new Set();

    // Demo images for placeholder
    const demoImages = [
      './img/camera/1.jpg',
      'img/camera/2.jpg',
      'img/camera/3.jpg',
      'img/camera/4.jpg'
    ];

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function showToast(message, type = 'success') {
      const toastContainer = document.getElementById('toastContainer');
      const toastId = 'toast-' + Date.now();
      const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-info';
      
      const toastHTML = `
        <div class="toast align-items-center text-white ${bgClass} border-0" id="${toastId}" role="alert">
          <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
        </div>
      `;
      
      toastContainer.insertAdjacentHTML('beforeend', toastHTML);
      const toastElement = document.getElementById(toastId);
      const toast = new coreui.Toast(toastElement);
      toast.show();
      
      setTimeout(() => toastElement.remove(), 5000);
    }

    function addAlert(message, type = 'warning') {
      const alert = {
        id: 'alert-' + Date.now(),
        message,
        type,
        time: new Date().toLocaleTimeString('vi-VN')
      };
      alerts.unshift(alert);
      if (alerts.length > 50) alerts.pop();
      renderAlerts();
    }

    // ============================================
    // CAMERA MANAGEMENT
    // ============================================
    function createCamera(name, location, streamUrl, type) {
      const id = 'cam-' + Date.now();
      const camera = {
        id,
        name,
        location,
        streamUrl: streamUrl || demoImages[cameras.length % demoImages.length],
        type,
        status: 'online',
        fps: Math.floor(Math.random() * 10) + 25,
        resolution: '1920x1080',
        bitrate: Math.floor(Math.random() * 2000) + 2000,
        recording: false,
        motionDetected: false
      };
      cameras.push(camera);
      renderCameras();
      showToast(`Đã thêm ${name}`, 'success');
    }

    function deleteCamera(id) {
      cameras = cameras.filter(c => c.id !== id);
      renderCameras();
      showToast('Đã xóa camera', 'success');
    }

    function changeView(viewType) {
      const grid = document.getElementById('cameraGrid');
      grid.className = `camera-grid view-${viewType}`;
      showToast(`Đã chuyển sang chế độ ${viewType}`, 'info');
    }

    // ============================================
    // CAMERA CONTROLS
    // ============================================
    function toggleRecording(id) {
      const camera = cameras.find(c => c.id === id);
      if (!camera) return;

      camera.recording = !camera.recording;
      if (camera.recording) {
        recordingCameras.add(id);
        showToast(`Đang ghi ${camera.name}`, 'success');
        addAlert(`Bắt đầu ghi: ${camera.name}`, 'info');
      } else {
        recordingCameras.delete(id);
        showToast(`Đã dừng ghi ${camera.name}`, 'warning');
      }
      renderCameras();
    }

    function captureSnapshot(id) {
      const camera = cameras.find(c => c.id === id);
      if (!camera) return;

      const snapshot = {
        id: 'snap-' + Date.now(),
        cameraId: id,
        cameraName: camera.name,
        image: camera.streamUrl,
        time: new Date().toLocaleString('vi-VN')
      };
      
      snapshots.unshift(snapshot);
      if (snapshots.length > 50) snapshots.pop();
      
      renderSnapshots();
      showToast(`Đã chụp từ ${camera.name}`, 'success');
      addAlert(`Ảnh chụp: ${camera.name}`, 'info');
    }

    function toggleFullscreen(id) {
      const card = document.getElementById(id);
      if (!card) return;

      if (card.classList.contains('fullscreen')) {
        card.classList.remove('fullscreen');
      } else {
        // Remove fullscreen from all other cards
        document.querySelectorAll('.camera-card.fullscreen').forEach(c => {
          c.classList.remove('fullscreen');
        });
        card.classList.add('fullscreen');
      }
    }

    function startAllRecording() {
      cameras.forEach(cam => {
        if (!cam.recording) {
          cam.recording = true;
          recordingCameras.add(cam.id);
        }
      });
      renderCameras();
      showToast('Đã bắt đầu ghi tất cả camera', 'success');
      addAlert('Bắt đầu ghi tất cả camera', 'info');
    }

    function stopAllRecording() {
      cameras.forEach(cam => {
        cam.recording = false;
      });
      recordingCameras.clear();
      renderCameras();
      showToast('Đã dừng ghi tất cả camera', 'warning');
    }

    function captureAllSnapshots() {
      cameras.forEach(cam => captureSnapshot(cam.id));
      showToast(`Đã chụp ${cameras.length} ảnh`, 'success');
    }

    function toggleMotionDetection() {
      motionDetectionEnabled = !motionDetectionEnabled;
      document.getElementById('motionText').textContent = motionDetectionEnabled ? 'Tắt phát hiện' : 'Bật phát hiện';
      showToast(`Phát hiện chuyển động: ${motionDetectionEnabled ? 'BẬT' : 'TẮT'}`, 'info');
      
      if (motionDetectionEnabled) {
        addAlert('Đã bật phát hiện chuyển động', 'info');
      }
    }

    // ============================================
    // RENDERING
    // ============================================
    function renderCameras() {
      const container = document.getElementById('cameraGrid');
      container.innerHTML = '';

      cameras.forEach(camera => {
        const statusClass = camera.status === 'online' ? 'status-online' : camera.status === 'offline' ? 'status-offline' : 'status-warning';
        const statusText = camera.status === 'online' ? 'Trực tuyến' : camera.status === 'offline' ? 'Ngoại tuyến' : 'Cảnh báo';

        const cameraHTML = `
          <div class="camera-card" id="${camera.id}">
            <div class="camera-header">
              <div class="camera-title">
                <i class="icon cil-camera"></i>
                <div>
                  <div>${camera.name}</div>
                  <small style="font-weight:normal;opacity:0.8">${camera.location}</small>
                </div>
              </div>
              <div class="camera-status">
                <span class="status-indicator ${statusClass}"></span>
                <span>${statusText}</span>
                <button class="btn btn-sm btn-danger ms-2" onclick="deleteCamera('${camera.id}')" title="Xóa">
                  <i class="icon cil-trash"></i>
                </button>
              </div>
            </div>

            <div class="camera-view">
              <img src="${camera.streamUrl}" class="camera-stream" alt="${camera.name}">
              
              <div class="recording-indicator ${camera.recording ? 'active' : ''}">
                <span class="rec-dot"></span>
                REC
              </div>

              <div class="motion-detected ${camera.motionDetected ? 'active' : ''}">
                <i class="icon cil-warning"></i> Phát hiện chuyển động!
              </div>

              <div class="camera-overlay">
                <div class="overlay-controls">
                  <button onclick="captureSnapshot('${camera.id}')" title="Chụp ảnh">
                    <i class="icon cil-camera"></i>
                  </button>
                  <button onclick="toggleRecording('${camera.id}')" title="${camera.recording ? 'Dừng ghi' : 'Ghi video'}">
                    <i class="icon ${camera.recording ? 'cil-media-stop' : 'cil-video'}"></i>
                  </button>
                  <button onclick="toggleFullscreen('${camera.id}')" title="Toàn màn hình">
                    <i class="icon cil-fullscreen"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="camera-info">
              <div class="info-row">
                <span class="info-label">FPS:</span>
                <span class="info-value">${camera.fps}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Độ phân giải:</span>
                <span class="info-value">${camera.resolution}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Bitrate:</span>
                <span class="info-value">${camera.bitrate} kbps</span>
              </div>
              <div class="info-row">
                <span class="info-label">Loại:</span>
                <span class="info-value">${camera.type}</span>
              </div>
            </div>
          </div>
        `;

        container.insertAdjacentHTML('beforeend', cameraHTML);
      });

      if (cameras.length === 0) {
        container.innerHTML = `
          <div class="camera-placeholder" style="grid-column: 1/-1; height: 400px;">
            <i class="icon cil-camera" style="font-size: 5rem;"></i>
            <h4>Chưa có camera nào</h4>
            <p>Nhấn "Thêm camera" để bắt đầu giám sát</p>
          </div>
        `;
      }
    }

    function renderSnapshots() {
      const container = document.getElementById('snapshotsGrid');
      container.innerHTML = '';

      if (snapshots.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">Chưa có ảnh chụp nào</div>';
        return;
      }

      snapshots.slice(0, 20).forEach(snapshot => {
        const snapshotHTML = `
          <div class="snapshot-item" onclick="viewSnapshot('${snapshot.id}')">
            <img src="${snapshot.image}" alt="${snapshot.cameraName}">
            <div class="snapshot-time">${snapshot.time}</div>
            <button class="snapshot-delete" onclick="event.stopPropagation(); deleteSnapshot('${snapshot.id}')">
              <i class="icon cil-x"></i>
            </button>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', snapshotHTML);
      });
    }

    function renderAlerts() {
      const container = document.getElementById('alertsList');
      container.innerHTML = '';

      if (alerts.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-3">Không có cảnh báo</div>';
        return;
      }

      alerts.slice(0, 10).forEach(alert => {
        const alertHTML = `
          <div class="alert-item ${alert.type}">
            <div class="d-flex justify-content-between">
              <strong>${alert.message}</strong>
              <small>${alert.time}</small>
            </div>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', alertHTML);
      });
    }

    // ============================================
    // SNAPSHOT FUNCTIONS
    // ============================================
    function deleteSnapshot(id) {
      snapshots = snapshots.filter(s => s.id !== id);
      renderSnapshots();
      showToast('Đã xóa ảnh', 'success');
    }

    function clearAllSnapshots() {
      if (confirm('Bạn có chắc muốn xóa tất cả ảnh chụp?')) {
        snapshots = [];
        renderSnapshots();
        showToast('Đã xóa tất cả ảnh', 'success');
      }
    }

    function viewSnapshot(id) {
      const snapshot = snapshots.find(s => s.id === id);
      if (!snapshot) return;

      // Create modal to view full image
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content bg-dark text-white">
            <div class="modal-header">
              <h5 class="modal-title">${snapshot.cameraName} - ${snapshot.time}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
              <img src="${snapshot.image}" style="width:100%; height:auto;">
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" onclick="downloadImage('${snapshot.image}', '${snapshot.cameraName}')">
                <i class="icon cil-cloud-download"></i> Tải xuống
              </button>
              <button class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const modalInstance = new coreui.Modal(modal);
      modalInstance.show();
      modal.addEventListener('hidden.coreui.modal', () => modal.remove());
    }

    function downloadImage(url, name) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đang tải xuống...', 'info');
    }

    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    function saveNewCamera() {
      const name = document.getElementById('newCameraName').value;
      const location = document.getElementById('newCameraLocation').value;
      const url = document.getElementById('newCameraUrl').value;
      const type = document.getElementById('newCameraType').value;

      if (!name || !location) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
      }

      createCamera(name, location, url, type);

      // Close modal and reset form
      const modal = coreui.Modal.getInstance(document.getElementById('addCameraModal'));
      modal.hide();
      document.getElementById('newCameraName').value = '';
      document.getElementById('newCameraLocation').value = '';
      document.getElementById('newCameraUrl').value = '';
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    document.getElementById('btnAddCamera').addEventListener('click', () => {
      const modal = new coreui.Modal(document.getElementById('addCameraModal'));
      modal.show();
    });

    document.getElementById('btnRefreshAll').addEventListener('click', () => {
      cameras.forEach(cam => {
        cam.fps = Math.floor(Math.random() * 10) + 25;
        cam.bitrate = Math.floor(Math.random() * 2000) + 2000;
      });
      renderCameras();
      showToast('Đã làm mới tất cả camera', 'success');
    });

    // Handle Enter key in modal
    document.getElementById('newCameraName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveNewCamera();
    });

    // ============================================
    // SIMULATION & AUTO-UPDATE
    // ============================================
    function simulateMotionDetection() {
      if (!motionDetectionEnabled) return;

      cameras.forEach(cam => {
        // Random chance of motion detection
        if (Math.random() > 0.95) {
          cam.motionDetected = true;
          showToast(`⚠️ Phát hiện chuyển động tại ${cam.name}`, 'warning');
          addAlert(`Phát hiện chuyển động: ${cam.name}`, 'warning');
          
          // Auto capture on motion
          captureSnapshot(cam.id);

          // Reset after 3 seconds
          setTimeout(() => {
            cam.motionDetected = false;
            renderCameras();
          }, 3000);
        }
      });
      renderCameras();
    }

    function updateCameraStats() {
      cameras.forEach(cam => {
        // Simulate FPS fluctuation
        cam.fps = Math.max(20, Math.min(35, cam.fps + (Math.random() - 0.5) * 2));
        cam.bitrate = Math.max(1500, Math.min(4500, cam.bitrate + (Math.random() - 0.5) * 200));
        
        // Random connection issues
        if (Math.random() > 0.98) {
          cam.status = cam.status === 'online' ? 'warning' : 'online';
          if (cam.status === 'warning') {
            addAlert(`Mất kết nối tạm thời: ${cam.name}`, 'warning');
          }
        }
      });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
      // Create demo cameras
      createCamera('Camera Cổng A1', 'Cổng chính phía Đông', '', 'gate');
      createCamera('Camera Giám sát nước', 'Khu vực đo mực nước', '', 'water');
      createCamera('Camera Lối vào', 'Lối vào chính', '', 'entrance');
      createCamera('Camera Tổng quan', 'Toàn cảnh khu vực', '', 'general');

      renderCameras();
      renderSnapshots();
      renderAlerts();

      // Add some demo alerts
      addAlert('Hệ thống khởi động thành công', 'info');
      addAlert('Tất cả camera đang hoạt động bình thường', 'info');

      // Start simulation intervals
      setInterval(simulateMotionDetection, 5000);
      setInterval(updateCameraStats, 2000);
      setInterval(renderCameras, 3000);
    }

    // ============================================
    // AUTO-SAVE & RESTORE STATE
    // ============================================
    function saveState() {
      const state = {
        cameras: cameras.map(c => ({...c, recording: false})), // Don't save recording state
        snapshots: snapshots.slice(0, 20), // Keep only recent snapshots
        alerts: alerts.slice(0, 20)
      };
      localStorage.setItem('cameraSystemState', JSON.stringify(state));
    }

    function restoreState() {
        try {
            const saved = localStorage.getItem('cameraSystemState');
            if (saved) {
            const state = JSON.parse(saved);
            if (state.cameras && state.cameras.length > 0) {
                cameras = state.cameras.map((c, idx) => ({
                ...c,
                streamUrl: demoImages[idx % demoImages.length] // cập nhật ảnh mới
                }));
            }
            if (state.snapshots) snapshots = state.snapshots;
            if (state.alerts) alerts = state.alerts;
            }
        } catch (e) {
            console.error('Failed to restore state:', e);
        }
    }


    // Save state periodically
    setInterval(saveState, 30000); // Every 30 seconds

    // Save state before page unload
    window.addEventListener('beforeunload', saveState);

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    document.addEventListener('keydown', (e) => {
      // ESC to exit fullscreen
      if (e.key === 'Escape') {
        document.querySelectorAll('.camera-card.fullscreen').forEach(card => {
          card.classList.remove('fullscreen');
        });
      }
      
      // Ctrl/Cmd + S to capture all
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        captureAllSnapshots();
      }
      
      // Ctrl/Cmd + R to start recording all
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        startAllRecording();
      }
      
      // Ctrl/Cmd + E to stop recording all
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        stopAllRecording();
      }
    });

    // ============================================
    // PERFORMANCE MONITORING
    // ============================================
    function logPerformance() {
      console.log(`
=== Camera System Status ===
Total Cameras: ${cameras.length}
Active Recordings: ${recordingCameras.size}
Total Snapshots: ${snapshots.length}
Total Alerts: ${alerts.length}
Motion Detection: ${motionDetectionEnabled ? 'ON' : 'OFF'}
===========================
      `);
    }

    // Log performance every minute
    setInterval(logPerformance, 60000);

    // ============================================
    // START APPLICATION
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
      restoreState();
      
      // If no cameras were restored, create demo ones
      if (cameras.length === 0) {
        init();
      } else {
        renderCameras();
        renderSnapshots();
        renderAlerts();
        
        // Restart simulation
        setInterval(simulateMotionDetection, 5000);
        setInterval(updateCameraStats, 2000);
        setInterval(renderCameras, 3000);
        
        showToast('Đã khôi phục trạng thái trước đó', 'info');
      }
      
      console.log('%c🎥 Camera Monitoring System Ready!', 'color: #3498db; font-size: 16px; font-weight: bold;');
      console.log('%cKeyboard shortcuts:', 'color: #2ecc71; font-weight: bold;');
      console.log('  Ctrl/Cmd + S: Chụp tất cả');
      console.log('  Ctrl/Cmd + R: Ghi tất cả');
      console.log('  Ctrl/Cmd + E: Dừng ghi tất cả');
      console.log('  ESC: Thoát toàn màn hình');
    });
    // ===== dynamic layout adjust =====
function adjustLayoutToSidebar() {
  const sidebar = document.getElementById('sidebar');
  const wrapper = document.querySelector('.wrapper');
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer');

  if (!sidebar || !wrapper) return;

  // Lấy kích thước thật của sidebar (0 nếu display none)
  const sidebarStyle = getComputedStyle(sidebar);
  const visible = sidebarStyle.display !== 'none' && sidebar.offsetWidth > 0;
  const width = visible ? sidebar.offsetWidth : 0;

  // Áp margin-left cho wrapper; header/footer sẽ cập nhật theo CSS trước
  wrapper.style.marginLeft = width ? width + 'px' : '0px';

  if (header) header.style.left = width ? width + 'px' : '0px';
  if (footer) footer.style.left = width ? width + 'px' : '0px';
  if (header) header.style.width = width ? `calc(100% - ${width}px)` : '100%';
  if (footer) footer.style.width = width ? `calc(100% - ${width}px)` : '100%';
}

// Chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  adjustLayoutToSidebar();

  // Khi thay đổi kích thước cửa sổ
  window.addEventListener('resize', () => {
    adjustLayoutToSidebar();
  });

  // Nếu bạn dùng nút toggle của CoreUI (sidebar unfoldable), lắng nghe click trên toggler để cập nhật
  document.querySelectorAll('.sidebar-toggler, [data-coreui-toggle="sidebar"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // chờ animation/coreui xử lý (nhỏ)
      setTimeout(adjustLayoutToSidebar, 200);
    });
  });

  // Nếu sidebar có sự kiện của coreui khi show/hide: lắng nghe mutation (dự phòng)
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) {
    const obs = new MutationObserver(() => adjustLayoutToSidebar());
    obs.observe(sidebarEl, { attributes: true, attributeFilter: ['class', 'style'] });
  }
});
