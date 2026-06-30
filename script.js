// Состояние игры (значения по умолчанию)
let gameData = {
    score: 0,
    clickValue: 1,
    passiveIncome: 0,
    clickerCost: 10,
    minerCost: 50
};

// Загрузка сохранения из localStorage, если оно есть
if (localStorage.getItem("clickerSave")) {
    gameData = JSON.parse(localStorage.getItem("clickerSave"));
}

// Элементы интерфейса
const scoreEl = document.getElementById("score");
const ppsEl = document.getElementById("pps");
const clickBtn = document.getElementById("click-btn");
const buyClickerBtn = document.getElementById("buy-clicker");
const buyMinerBtn = document.getElementById("buy-miner");
const clickerCostEl = document.getElementById("clicker-cost");
const minerCostEl = document.getElementById("miner-cost");

// Функция обновления текста на экране
function updateDisplay() {
    scoreEl.innerText = Math.floor(gameData.score);
    ppsEl.innerText = gameData.passiveIncome;
    clickerCostEl.innerText = gameData.clickerCost;
    minerCostEl.innerText = gameData.minerCost;
}

// Функция сохранения игры
function saveGame() {
    localStorage.setItem("clickerSave", JSON.stringify(gameData));
}

// Главный клик
clickBtn.addEventListener("click", () => {
    gameData.score += gameData.clickValue;
    updateDisplay();
    saveGame();
});

// Покупка улучшения клика
buyClickerBtn.addEventListener("click", () => {
    if (gameData.score >= gameData.clickerCost) {
        gameData.score -= gameData.clickerCost;
        gameData.clickValue += 1;
        gameData.clickerCost = Math.round(gameData.clickerCost * 1.5);
        updateDisplay();
        saveGame();
    } else {
        alert("Недостаточно монет!");
    }
});

// Покупка пассивного дохода
buyMinerBtn.addEventListener("click", () => {
    if (gameData.score >= gameData.minerCost) {
        gameData.score -= gameData.minerCost;
        gameData.passiveIncome += 1;
        gameData.minerCost = Math.round(gameData.minerCost * 1.5);
        updateDisplay();
        saveGame();
    } else {
        alert("Недостаточно монет!");
    }
});

// Таймер для пассивного дохода (срабатывает раз в секунду)
setInterval(() => {
    gameData.score += gameData.passiveIncome;
    updateDisplay();
    saveGame();
}, 1000);

// Инициализация экрана при запуске
updateDisplay();
