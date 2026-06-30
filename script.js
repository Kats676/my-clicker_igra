// ==================== ПОДКЛЮЧЕНИЕ К СЕРВЕРУ ====================
const socket = io();

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let myNickname = '';
let currentRoom = '';
let myCoins = 0;
let chairCooldown = false;
let chairTimer = 0;

// ==================== ЧАСТИЦЫ ФОНА ====================
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 4 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 6 + 4) + 's';
    container.appendChild(particle);
  }
}

// ==================== ВХОД В КОМНАТУ ====================
function joinRoom() {
  const nicknameInput = document.getElementById('nicknameInput');
  const roomInput = document.getElementById('roomInput');
  const nickname = nicknameInput.value.trim();
  const room = roomInput.value.trim();

  if (!nickname || !room) {
    const loginBox = document.querySelector('.login-box');
    loginBox.style.animation = 'none';
    loginBox.offsetHeight;
    loginBox.style.animation = 'shake 0.5s ease';
    return;
  }

  myNickname = nickname;
  currentRoom = room;
  
  socket.emit('join-room', room, nickname);

  const loginScreen = document.getElementById('loginScreen');
  loginScreen.classList.add('hidden');

  setTimeout(() => {
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('roomBadge').textContent = '#' + room;
  }, 400);

  setupSocketListeners();
  setupClickerListeners();
  updateShopButtons();
}

// ==================== НАСТРОЙКА СЛУШАТЕЛЕЙ СОКЕТА ====================
function setupSocketListeners() {
  // Получение сообщений
  socket.off('chat-message');
  socket.on('chat-message', (data) => {
    const container = document.getElementById('messagesContainer');
    
    if (data.nickname === '⚙️ Система') {
      const div = document.createElement('div');
      div.className = 'system-message';
      div.textContent = data.message;
      container.appendChild(div);
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'message-wrapper';
      
      const firstLetter = data.nickname ? data.nickname[0].toUpperCase() : '?';
      
      wrapper.innerHTML = `
        <div class="message-avatar">${firstLetter}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-nickname">${escapeHTML(data.nickname)}</span>
            <span class="message-time">${escapeHTML(data.time)}</span>
          </div>
          <div class="message-bubble">${escapeHTML(data.message)}</div>
        </div>
      `;
      container.appendChild(wrapper);
    }
    
    container.scrollTop = container.scrollHeight;
  });

  // Обновление списка участников
  socket.off('update-users');
  socket.on('update-users', (users) => {
    document.getElementById('onlineCount').textContent = users.length;
    const list = document.getElementById('usersList');
    list.innerHTML = users.map(u => `
      <div class="user-item">
        <div class="user-avatar">${escapeHTML(u.nickname[0].toUpperCase())}</div>
        <div class="user-info">
          <div class="user-name">${escapeHTML(u.nickname)}</div>
          <div class="user-status"><span class="status-dot"></span> онлайн</div>
        </div>
      </div>
    `).join('');
  });

  // Получение броска
  socket.off('receive-throw');
  socket.on('receive-throw', (data) => {
    if (data.to === myNickname) {
      applyEffect(data.item);
    }
    
    // Показываем уведомление всем
    const container = document.getElementById('messagesContainer');
    const notif = document.createElement('div');
    notif.className = 'throw-notification';
    
    const itemEmoji = {
      'chair': '🪑',
      'bomb': '💣',
      'respect': '✨'
    };
    
    notif.textContent = `${itemEmoji[data.item] || ''} ${escapeHTML(data.from)} → ${escapeHTML(data.to)}: ${data.item === 'chair' ? 'СТУЛ В ЛЕТ' : data.item === 'bomb' ? 'БОМБА!' : 'РЕСПЕКТ!'}`;
    container.appendChild(notif);
    container.scrollTop = container.scrollHeight;
    
    setTimeout(() => notif.remove(), 3000);
  });
}

// ==================== ОТПРАВКА СООБЩЕНИЯ ====================
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message || !socket) return;
  
  socket.emit('send-message', message);
  input.value = '';
  input.focus();
}

// ==================== КЛИКЕР ====================
function setupClickerListeners() {
  const farmBtn = document.getElementById('farmBtn');
  if (!farmBtn) return;
  
  farmBtn.addEventListener('click', () => {
    myCoins++;
    updateBalanceDisplay();
    updateShopButtons();
    
    // Отправляем на сервер для ачивок (опционально)
    socket.emit('player-action', { type: 'farm' });
  });
}

function updateBalanceDisplay() {
  const coinCount = document.getElementById('coinCount');
  if (coinCount) {
    coinCount.textContent = myCoins;
  }
}

function updateShopButtons() {
  const bombBtn = document.getElementById('bombBtn');
  const respectBtn = document.getElementById('respectBtn');
  const chairBtn = document.getElementById('chairBtn');
  
  if (bombBtn) {
    bombBtn.disabled = myCoins < 50;
  }
  if (respectBtn) {
    respectBtn.disabled = myCoins < 100;
  }
  if (chairBtn) {
    if (chairCooldown) {
      chairBtn.disabled = true;
      chairBtn.querySelector('.cooldown').textContent = `(${chairTimer}с)`;
    } else {
      chairBtn.disabled = false;
      chairBtn.querySelector('.cooldown').textContent = '';
    }
  }
}

// ==================== БРОСОК ПРЕДМЕТА ====================
function throwItem(item) {
  // Проверка кулдауна стула
  if (item === 'chair' && chairCooldown) {
    alert('Стул перезаряжается! Подожди ' + chairTimer + ' сек.');
    return;
  }

  // Проверка валюты
  if (item === 'bomb' && myCoins < 50) {
    alert('Недостаточно монет! Нужно 50.');
    return;
  }
  if (item === 'respect' && myCoins < 100) {
    alert('Недостаточно монет! Нужно 100.');
    return;
  }

  const target = prompt('Введите ник того, в кого кидаем:');
  if (!target || target.trim() === '') return;
  
  if (target.trim() === myNickname) {
    alert('В себя кидать нельзя!');
    return;
  }

  // Списываем валюту
  if (item === 'bomb') myCoins -= 50;
  if (item === 'respect') myCoins -= 100;
  
  // Запускаем кулдаун стула
  if (item === 'chair') {
    chairCooldown = true;
    chairTimer = 30;
    const interval = setInterval(() => {
      chairTimer--;
      updateShopButtons();
      if (chairTimer <= 0) {
        chairCooldown = false;
        clearInterval(interval);
        updateShopButtons();
      }
    }, 1000);
  }

  updateBalanceDisplay();
  updateShopButtons();

  // Отправляем на сервер
  socket.emit('throw-item', {
    from: myNickname,
    to: target.trim(),
    item: item
  });
}

// ==================== ПРИМЕНЕНИЕ ЭФФЕКТА НА СЕБЯ ====================
function applyEffect(item) {
  switch(item) {
    case 'chair':
      // Тряска экрана
      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 500);
      
      // Всплывающий текст
      showEffectText('🪑 СТУЛ!');
      
      // Звук удара (если браузер разрешает)
      try {
        const audio = new Audio('https://www.myinstants.com/media/sounds/punch-or-slap-mp3.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch(e) {}
      break;
      
    case 'bomb':
      // Красная вспышка
      const overlay = document.createElement('div');
      overlay.className = 'effect-overlay';
      overlay.style.background = 'rgba(255, 0, 0, 0.7)';
      document.body.appendChild(overlay);
      setTimeout(() => { overlay.style.opacity = '0'; }, 200);
      setTimeout(() => { overlay.remove(); }, 600);
      
      showEffectText('💣 БОМБА!');
      
      try {
        const audio = new Audio('https://www.myinstants.com/media/sounds/explosion-sound-effect.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch(e) {}
      break;
      
    case 'respect':
      // Салют из частиц
      createRespectParticles();
      showEffectText('✨ РЕСПЕКТ!');
      
      try {
        const audio = new Audio('https://www.myinstants.com/media/sounds/clapping-crowd.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch(e) {}
      break;
  }
}

// ==================== ВСПЛЫВАЮЩИЙ ТЕКСТ ====================
function showEffectText(text) {
  const el = document.createElement('div');
  el.className = 'effect-text';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ==================== ЧАСТИЦЫ РЕСПЕКТА ====================
function createRespectParticles() {
  const emojis = ['✨', '🌟', '💜', '🎉', '💎', '🔥'];
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      font-size: ${Math.random() * 30 + 20}px;
      z-index: 10001;
      pointer-events: none;
      animation: respectFloat ${Math.random() * 2 + 2}s ease forwards;
    `;
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 3000);
  }
}

// Добавляем анимацию для частиц респекта
const respectStyle = document.createElement('style');
respectStyle.textContent = `
  @keyframes respectFloat {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-200px) scale(0);
    }
  }
`;
document.head.appendChild(respectStyle);

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== ЗАПУСК ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  
  // Обработчик Enter на экране входа
  const roomInput = document.getElementById('roomInput');
  if (roomInput) {
    roomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') joinRoom();
    });
  }
  
  // Обработчик Enter в поле сообщения
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
});
