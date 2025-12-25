// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_SPEED = 1;
const ENEMY_DROP = 30;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 10;
const ENEMY_SPACING_X = 70;
const ENEMY_SPACING_Y = 60;
const ENEMY_START_Y = 80;
const PLAYER_START_X = CANVAS_WIDTH / 2;
const PLAYER_START_Y = CANVAS_HEIGHT - 50;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const ENEMY_SHOOT_CHANCE = 0.001; // Probability per frame

// Game State
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'
let score = 0;
let lives = 3;
let wave = 1;
let animationId = null;

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Input Handling
const keys = {};
let keyPressed = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keyPressed[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Player Class
class Player {
    constructor() {
        this.x = PLAYER_START_X;
        this.y = PLAYER_START_Y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.speed = PLAYER_SPEED;
    }

    update() {
        // Movement
        if (keys['arrowleft'] || keys['a']) {
            this.x = Math.max(this.width / 2, this.x - this.speed);
        }
        if (keys['arrowright'] || keys['d']) {
            this.x = Math.min(CANVAS_WIDTH - this.width / 2, this.x + this.speed);
        }
    }

    draw() {
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        // Draw triangle ship
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d4ff';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    shoot() {
        if (keyPressed[' '] || keyPressed['space']) {
            keyPressed[' '] = false;
            keyPressed['space'] = false;
            return new Bullet(this.x, this.y, -BULLET_SPEED, 'player');
        }
        return null;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.alive = true;
    }

    update(direction) {
        this.x += direction * ENEMY_SPEED;
    }

    draw() {
        if (!this.alive) return;
        
        ctx.fillStyle = '#ff4444';
        // Draw enemy shape (simplified invader)
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height / 2);
        ctx.fillRect(this.x - this.width / 2 + 5, this.y + this.height / 2, this.width - 10, this.height / 2);
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4444';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height / 2);
        ctx.fillRect(this.x - this.width / 2 + 5, this.y + this.height / 2, this.width - 10, this.height / 2);
        ctx.shadowBlur = 0;
    }

    shoot() {
        if (Math.random() < ENEMY_SHOOT_CHANCE && this.alive) {
            return new Bullet(this.x, this.y + this.height, BULLET_SPEED, 'enemy');
        }
        return null;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, speed, type) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.type = type; // 'player' or 'enemy'
        this.width = BULLET_WIDTH;
        this.height = BULLET_HEIGHT;
        this.active = true;
    }

    update() {
        this.y += this.speed;
        if (this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        
        ctx.fillStyle = this.type === 'player' ? '#00d4ff' : '#ff4444';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.type === 'player' ? '#00d4ff' : '#ff4444';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Game Class
class Game {
    constructor() {
        this.player = new Player();
        this.enemies = [];
        this.bullets = [];
        this.enemyDirection = 1;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 30;
        this.shouldDrop = false;
    }

    init() {
        this.player = new Player();
        this.enemies = [];
        this.bullets = [];
        this.enemyDirection = 1;
        this.enemyMoveTimer = 0;
        this.shouldDrop = false;
        this.createEnemyWave();
    }

    createEnemyWave() {
        const startX = (CANVAS_WIDTH - (ENEMY_COLS - 1) * ENEMY_SPACING_X) / 2;
        for (let row = 0; row < ENEMY_ROWS; row++) {
            for (let col = 0; col < ENEMY_COLS; col++) {
                const x = startX + col * ENEMY_SPACING_X;
                const y = ENEMY_START_Y + row * ENEMY_SPACING_Y;
                this.enemies.push(new Enemy(x, y));
            }
        }
    }

    update() {
        if (gameState !== 'playing') return;

        // Update player
        this.player.update();
        
        // Player shooting
        const playerBullet = this.player.shoot();
        if (playerBullet) {
            this.bullets.push(playerBullet);
        }

        // Update enemies
        this.enemyMoveTimer++;
        if (this.enemyMoveTimer >= this.enemyMoveInterval) {
            this.enemyMoveTimer = 0;
            
            // Check if enemies hit wall
            let hitWall = false;
            for (let enemy of this.enemies) {
                if (enemy.alive) {
                    if (enemy.x + enemy.width / 2 >= CANVAS_WIDTH || enemy.x - enemy.width / 2 <= 0) {
                        hitWall = true;
                        break;
                    }
                }
            }
            
            if (hitWall) {
                this.enemyDirection *= -1;
                this.shouldDrop = true;
            }
            
            // Move enemies
            for (let enemy of this.enemies) {
                if (enemy.alive) {
                    enemy.update(this.enemyDirection);
                    if (this.shouldDrop) {
                        enemy.y += ENEMY_DROP;
                    }
                }
            }
            
            this.shouldDrop = false;
        }

        // Enemy shooting
        for (let enemy of this.enemies) {
            if (enemy.alive) {
                const bullet = enemy.shoot();
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }
        }

        // Update bullets
        for (let bullet of this.bullets) {
            bullet.update();
        }
        this.bullets = this.bullets.filter(b => b.active);

        // Collision detection
        this.checkCollisions();

        // Check game over conditions
        this.checkGameOver();
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.type !== 'player' || !bullet.active) continue;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy.alive) continue;

                if (this.isColliding(bullet.getBounds(), enemy.getBounds())) {
                    bullet.active = false;
                    enemy.alive = false;
                    score += 10;
                    updateUI();
                    break;
                }
            }
        }

        // Enemy bullets vs player
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.type !== 'enemy' || !bullet.active) continue;

            if (this.isColliding(bullet.getBounds(), this.player.getBounds())) {
                bullet.active = false;
                lives--;
                updateUI();
                
                if (lives <= 0) {
                    gameState = 'gameOver';
                    showGameOver();
                } else {
                    // Reset player position after hit
                    this.player.x = PLAYER_START_X;
                }
                break;
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkGameOver() {
        // Check if enemies reached bottom
        for (let enemy of this.enemies) {
            if (enemy.alive && enemy.y + enemy.height >= this.player.y) {
                gameState = 'gameOver';
                showGameOver();
                return;
            }
        }

        // Check if all enemies destroyed
        const aliveEnemies = this.enemies.filter(e => e.alive);
        if (aliveEnemies.length === 0) {
            wave++;
            updateUI();
            this.init(); // Start next wave
        }
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw stars background
        this.drawStars();

        // Draw player
        this.player.draw();

        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.draw();
        }

        // Draw bullets
        for (let bullet of this.bullets) {
            bullet.draw();
        }
    }

    drawStars() {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % CANVAS_WIDTH;
            const y = (i * 53) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// Game instance
const game = new Game();

// UI Update functions
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('wave').textContent = wave;
}

function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('gameOverOverlay').style.display = 'flex';
}

function hideGameOver() {
    document.getElementById('gameOverOverlay').style.display = 'none';
}

function hideMenu() {
    document.getElementById('menuOverlay').style.display = 'none';
}

function showMenu() {
    document.getElementById('menuOverlay').style.display = 'flex';
}

// Game loop
function gameLoop() {
    game.update();
    game.draw();
    
    if (gameState === 'playing') {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Start game function
function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    wave = 1;
    hideMenu();
    hideGameOver();
    updateUI();
    game.init();
    gameLoop();
}

// Restart game function
function restartGame() {
    startGame();
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);

// Initialize
updateUI();

