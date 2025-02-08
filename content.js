// content.js（内容脚本）
let lastX = 0;
let lastY = 0;

// 实时记录鼠标位置
document.addEventListener('mousemove', (e) => {
  lastX = e.pageX;
  lastY = e.pageY;
});

// 处理消息通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPosition') {
    sendResponse({ x: lastX, y: lastY });
  }

  if (request.action === 'processCapture') {
    const { dataUrl, x, y } = request;
    const img = new Image();

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = window.devicePixelRatio || 1;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const pixel = ctx.getImageData(
        Math.round(x * scale),
        Math.round(y * scale),
        1,
        1
      ).data;

      const hex = `#${[pixel[0], pixel[1], pixel[2]]
        .map(c => c.toString(16).padStart(2, '0')).join('')}`;
      if (!navigator.clipboard) {
        showErrTips('该网页或浏览器不支持复制功能');
        sendResponse({ success: false, error: '该网页或浏览器不支持复制功能' });
        return;
      }
      navigator.clipboard.writeText(hex).then(() => {
        showColorIndicator(hex);
        sendResponse({ success: true });

      }).catch(error => {
        showErrTips('复制失败,请刷新再试');
        sendResponse({ success: false, error: error.message });
      });
    };

    img.src = dataUrl;
    return true;
  }

  if (request.action === 'showError') {
    showErrTips(request.message);
  }
});

// 显示颜色指示器
function showColorIndicator(color) {
  const indicator = document.createElement('div');

  Object.assign(indicator.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px',
    backgroundColor: color,
    color: getContrastColor(color),
    borderRadius: '4px',
    zIndex: '999999',
    transition: 'opacity 0.3s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  });

  indicator.textContent = `${color} ✅`;
  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 1000);
}

// 获取对比色
function getContrastColor(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000' : '#fff';
}

// 添加错误提示处理函数
function showErrTips(errMsg) {
  const indicator = document.createElement('div');
  Object.assign(indicator.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px',
    backgroundColor: '#f44336',
    color: '#fff',
    borderRadius: '4px',
    zIndex: '999999',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'opacity 0.3s'
  });
  indicator.textContent = errMsg;
  document.body.appendChild(indicator);
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 3000);
}