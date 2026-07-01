let canvas = 
document.getElementById(G)
let ctx = 
canvas.getContext(2d)

canvas.width = 
window.innerWidth
canvas.height = 
window.innerHeight

let keys = 
parseInt(
localStorage.getItem(
`gd_keys`
)) || 5

let coins = 
parseInt(
localStorage.getItem(
`gd_coins`
)) || 0

let score = 0
let level = 1
let levelProgress = 0
let pointsToNext = 4
let gameState = 0 
let isHolding = false

let player = {
x: canvas.width * 0.15,
y: canvas.height - 150,
size: 36, vy: 0, 
gravity: 0.7, 
jumpForce: -13,
isGrounded: false,
angle: 0, 
targetAngle: 0,
mode: `cube`
}

let trail = []
let particles = []
let obstacles = []
let targetCoins = []
let spawnTimer = 0
let gameSpeed = 6.5
let floorY = 
canvas.height - 120
let flashEffect = 0 

window.addEventListener(
touchstart, () => {
isHolding = true
if (gameState == 0) {
if (player.mode == 
`cube` && 
player.isGrounded) {
player.vy = 
player.jumpForce
player.isGrounded = 
false
player.targetAngle += 
Math.PI
}
if (player.mode == 
`ball` && 
player.isGrounded) {
player.gravity = 
-player.gravity
player.isGrounded = 
false
}}}
)

window.addEventListener(
touchend, () => {
isHolding = false
})

function spawnObjects() {
if (spawnTimer <= 0) {
let r = Math.random()
if (r < 0.4) {
obstacles.push({
x: canvas.width,
w: 26, h: 38,
passed: false
})
} else if (r < 0.7) {
obstacles.push({
x: canvas.width,
w: 50, h: 38,
passed: false
})
} else {
obstacles.push({
x: canvas.width,
w: 28, h: 48,
passed: false
})
}
if (Math.random() > 
0.5) {
targetCoins.push({
x: canvas.width + 20,
y: floorY - 80 - 
Math.random() * 80,
r: 12
})
}
spawnTimer = 
70 + Math.random() * 
50 - (level * 2.5)
if (spawnTimer < 40)
spawnTimer = 40
}
spawnTimer--
}

function updateGameLogic() {
if (gameState != 0) 
return

if (level >= 1 && 
level <= 5) {
player.mode = `cube`
} else if (level >= 6 && 
level <= 12) {
player.mode = `ship`
} else {
player.mode = `ball`
}

if (player.mode == 
`ship`) {
player.gravity = 0.35
if (isHolding) {
player.vy -= 0.8
} else {
player.vy += 
player.gravity
}
if (player.vy > 7) 
player.vy = 7
if (player.vy < -7) 
player.vy = -7
player.angle = 
player.vy * 0.07
} else if (player.mode == 
`ball`) {
player.y += player.vy
if (player.gravity > 0) 
{ player.vy += 0.75 } 
else { player.vy -= 0.75 }
player.angle += 0.09
} else {
player.gravity = 0.7
player.vy += 
player.gravity
if (!player.isGrounded) {
player.angle += 
(player.targetAngle - 
player.angle) * 0.12
} else {
player.angle = 
Math.round(
player.angle / 
(Math.PI / 2)
) * (Math.PI / 2)
player.targetAngle = 
player.angle
}}

if (player.mode != 
`ball`) {
player.y += player.vy
}

if (player.gravity > 0 || 
player.mode != `ball`) {
if (player.y >= 
floorY - player.size) {
player.y = 
floorY - player.size
player.vy = 0
player.isGrounded = 
true
}
} else {
if (player.y <= 60) {
player.y = 60
player.vy = 0
player.isGrounded = 
true
}}

if (player.y <= 60 && 
player.mode == `ship`) { 
player.y = 60
player.vy = 0 
}

trail.push({
x: player.x,
y: player.y
})
if (trail.length > 15)
trail.shift()

spawnObjects()

for (let i = 
targetCoins.length - 1; 
i >= 0; i--) {
targetCoins[i].x -= 
gameSpeed
let dx = 
(player.x + 
player.size / 2) - 
targetCoins[i].x
let dy = 
(player.y + 
player.size / 2) - 
targetCoins[i].y
let dist = 
Math.sqrt(
dx * dx + dy * dy
)
if (dist < 
(player.size / 2) + 
targetCoins[i].r) {
coins++
localStorage.setItem(
`gd_coins`, coins
)
targetCoins.splice(i, 1)
for (let p = 0; p < 8; 
p++) createParticle(
player.x + 15, 
player.y + 15, 
`#ffff00`
)
continue
}
if (targetCoins[i].x < 
-50) 
targetCoins.splice(i, 1)
}

for (let i = 
obstacles.length - 1; 
i >= 0; i--) {
obstacles[i].x -= 
gameSpeed
if (obstacles[i].x + 
obstacles[i].w < 
player.x && 
!obstacles[i].passed) {
score++
levelProgress++
obstacles[i].passed = 
true
if (score % 3 == 0) {
keys++
localStorage.setItem(
`gd_keys`, keys
)
}
if (levelProgress >= 
pointsToNext) {
level++
levelProgress = 0
pointsToNext = 
4 + level
gameSpeed = 
6.5 + (level * 0.35)
flashEffect = 10 
}}
if (player.x < 
obstacles[i].x + 
obstacles[i].w &&
player.x + 
player.size > 
obstacles[i].x &&
player.y + 
player.size > 
floorY - 
obstacles[i].h &&
player.y < floorY) {
triggerExplosion()
}
if (obstacles[i] && 
obstacles[i].x < -50) 
obstacles.splice(i, 1)
}

if (flashEffect > 0) 
flashEffect--

for (let i = 
particles.length - 1; 
i >= 0; i--) {
particles[i].x += 
particles[i].vx
particles[i].y += 
particles[i].vy
particles[i].alpha -= 
0.02
if (particles[i].alpha 
<= 0) 
particles.splice(i, 1)
}
}

function renderGraphics() {
ctx.clearRect(
0, 0, 
canvas.width, 
canvas.height
)
ctx.strokeStyle = 
`rgba(255,255,255,0.015)`
ctx.lineWidth = 1
for (let i = 0; 
i < canvas.width; 
i += 60) {
ctx.beginPath()
ctx.moveTo(i, 0)
ctx.lineTo(
i, canvas.height
)
ctx.stroke()
}
ctx.lineWidth = 5
ctx.shadowBlur = 20
ctx.strokeStyle = 
`#00ffcc`
ctx.shadowColor = 
`#00ffcc`
ctx.beginPath()
ctx.moveTo(0, floorY)
ctx.lineTo(
canvas.width, floorY
)
ctx.stroke()
ctx.strokeStyle = 
`#0077ff`
ctx.shadowColor = 
`#0077ff`
ctx.beginPath()
ctx.moveTo(0, 60)
ctx.lineTo(
canvas.width, 60
)
ctx.stroke()

if (flashEffect > 0) {
ctx.fillStyle = 
`rgba(0, 255, 220, 
${flashEffect * 0.05})`
ctx.fillRect(
0, 0, 
canvas.width, 
canvas.height
)
}

particles.forEach(p => {
ctx.fillStyle = p.color
ctx.shadowColor = 
p.color
ctx.shadowBlur = 10
ctx.globalAlpha = 
p.alpha
ctx.fillRect(
p.x, p.y, 
p.size, p.size
)
})
ctx.globalAlpha = 1

trail.forEach(
(t, index) => {
ctx.fillStyle = 
`rgba(0, 255, 220, 
${index / 
trail.length * 0.3})`
ctx.shadowBlur = 0
ctx.fillRect(
t.x, t.y, 
player.size, 
player.size
)
})

ctx.save()
ctx.translate(
player.x + 
player.size / 2, 
player.y + 
player.size / 2
)
ctx.rotate(player.angle)
if (player.mode == 
`ship`) {
ctx.fillStyle = 
`#ffff00`
ctx.shadowColor = 
`#ffff00`
} else if (player.mode == 
`ball`) {
ctx.fillStyle = 
`#ff00ff`
ctx.shadowColor = 
`#ff00ff`
} else {
ctx.fillStyle = 
`#00ffcc`
ctx.shadowColor = 
`#00ffcc`
}
ctx.shadowBlur = 25
ctx.fillRect(
-player.size / 2, 
-player.size / 2, 
player.size, 
player.size
)
ctx.strokeStyle = 
`#ffffff`
ctx.lineWidth = 2
ctx.strokeRect(
-player.size / 2, 
-player.size / 2, 
player.size, 
player.size
)
ctx.restore()

ctx.fillStyle = 
`#ffff00`
ctx.shadowColor = 
`#ffff00`
ctx.shadowBlur = 15
targetCoins.forEach(
m => {
ctx.beginPath()
ctx.arc(
m.x, m.y, m.r, 
0, Math.PI * 2
)
ctx.fill()
})

ctx.fillStyle = 
`#ff3366`
ctx.shadowColor = 
`#ff3366`
ctx.shadowBlur = 15
obstacles.forEach(o => {
ctx.beginPath()
ctx.moveTo(o.x, floorY)
ctx.lineTo(
o.x + o.w / 2, 
floorY - o.h
)
ctx.lineTo(
o.x + o.w, floorY
)
ctx.fill()
})
ctx.shadowBlur = 0

ctx.fillStyle = 
`#ffffff`
ctx.font = 
`bold 24px sans-serif`
ctx.fillText(
`УРОВЕНЬ ` + level, 
30, 105
)
ctx.fillStyle = 
`#ff9900`
ctx.fillText(
`🔑 ` + keys, 
canvas.width - 120, 
105
)
ctx.fillStyle = 
`#ffff00`
ctx.fillText(
`🪙 ` + coins, 
canvas.width - 240, 
105
)

ctx.fillStyle = 
`#222233`
ctx.fillRect(
30, 120, 200, 10
)
ctx.fillStyle = 
`#00ffcc`
let currentProgress = 
(levelProgress / 
pointsToNext) * 200
ctx.fillRect(
30, 120, 
currentProgress, 10
)
}

function createParticle(
x, y, color
) {
particles.push({
x: x, y: y,
vx: (Math.random() - 
0.5) * 10,
vy: (Math.random() - 
0.5) * 10,
size: Math.random() * 
5 + 4,
alpha: 1, 
color: color
})
}

function triggerExplosion() {
gameState = 1
let pColor = 
player.mode == `ship` ? 
`#ffff00` : 
(player.mode == `ball` ? 
`#ff00ff` : `#00ffcc`)
for (let i = 0; 
i < 35; i++) 
createParticle(
player.x + 15, 
player.y + 15, 
pColor
)
document.getElementById(
`SCORE_TXT`
).innerText = 
`Счет в раунде: ` + 
score
document.getElementById(
`LVL_TXT`
).innerText = 
`ТЕКУЩИЙ УРОВЕНЬ: ` + 
level
let modeName = 
player.mode == `ship` ? 
`КОРАБЛИК 🚀 (Лвл 6-12)` : 
(player.mode == `ball` ? 
`ШАР 🔮 (Лвл 13+)` : 
`КУБИК 🧊 (Лвл 1-5)`)
document.getElementById(
`MODE_TXT`
).innerText = 
`Режим: ` + modeName
let menuProgress = 
(levelProgress / 
pointsToNext) * 100
document.getElementById(
`FILL`
).style.width = 
menuProgress + `%`
document.getElementById(
`M1`
).style.display = 
`block`
}

function restartGame() {
obstacles = []
targetCoins = []
score = 0
level = 1
levelProgress = 0
pointsToNext = 4
gameSpeed = 6.5
gameState = 0
player.gravity = 0.7
player.y = 
floorY - player.size
player.angle = 0
player.targetAngle = 0
document.getElementById(
`M1`
).style.display = 
`none`
}

function revivePlayer() {
if (keys >= 1) {
keys--
localStorage.setItem(
`gd_keys`, keys
)
document.getElementById(
`keyCount`
).innerText = keys
obstacles = []
targetCoins = []
gameState = 0
player.y = 
floorY - player.size
player.vy = 0
player.angle = 0
player.targetAngle = 0
document.getElementById(
`M1`
).style.display = 
`none`
} else {
alert(`Нет ключей!`)
}}

function openDonateMenu() {
document.getElementById(
`M1`
).style.display = 
`none`
document.getElementById(
`M2`
).style.display = 
`block`
}

function closeDonateMenu() {
document.getElementById(
`M2`
).style.display = 
`none`
document.getElementById(
`M1`
).style.display = 
`block`
}

function paySystem(type) {
if (type == 1) 
window.open(
`https://aaio.so`, 
`_blank`
)
if (type == 3) 
window.open(
`https://www.donationalerts.com/r/katsigra`, 
`_blank`
)
if (type == 2) 
alert(`Готово!`)
}

function mainGameLoop() {
updateGameLogic()
renderGraphics()
requestAnimationFrame(
mainGameLoop
)
}

setTimeout(() => { 
mainGameLoop() 
}, 100)
