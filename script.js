// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load the cat images
const catImage = new Image();
catImage.src = 'cat.png'; // Normal position cat image
const catCrouchImage = new Image();
catCrouchImage.src = 'cat1.png'; // Crouching position cat image

// Load the life object image
const lifeImage = new Image();
lifeImage.src = 'life.png'; // Life object image

// Load sounds
const catShootSound = new Audio('cat_shoot.mp3'); // Replace with your sound path
const memeShootSound = new Audio('meme_shoot.mp3'); // Replace with your sound path
const lifeSound = new Audio('life_sound.mp3'); // Life object sound path
const backgroundMusic = new Audio('background_music.mp3'); // Background music path

// Loop background music
backgroundMusic.loop = true;

// Character variables
const characterWidth = 147; // 15% bigger
const characterHeight = 147;
let characterX = 50;
let characterY = canvas.height - characterHeight - 30; // Adjusted for floor
let crouching = false;
let jumping = false;
let jumpHeight = 120; // 20% higher
let jumpCount = 0;
let catLives = 9;
let catHit = 0;
let moveLeft = false;
let moveRight = false;

// Meme variables
const memeNames = ['Ponke', 'WIF', 'Derulo', 'Kook the caller', 'DJ Budsol'];
const memeImages = ['meme1.png', 'meme2.png', 'meme3.png', 'meme4.png', 'meme5.png']; // Replace with your meme image paths
let currentMemeIndex = 0;
let memeHit = 0;
const memeWidth = 115; // 10% smaller
const memeHeight = 115;
let memeX = canvas.width - memeWidth - 20;
let memeY = canvas.height - memeHeight - 30; // Adjusted for floor
const memeSpeed = 2;
const memeJumpHeight = 80;
let memeDirection = 1;
let memeJumping = false;
let memeJumpCount = 0;
let memeShootInterval;
let memeLasers = [];

// Laser variables
let catLasers = [];
const laserWidth = 8; // 20% shorter
const laserHeight = 10; // Horizontal lasers
const laserLength = 32; // 20% shorter horizontally
const laserSpeed = 5;

// Life object variables
const lifeObjectWidth = 60; // 100% bigger
const lifeObjectHeight = 60; // 100% bigger
let lifeObjectX = Math.random() * (canvas.width / 2 - lifeObjectWidth); // Fall on the left side of the screen
let lifeObjectY = -lifeObjectHeight;
let lifeObjectFalling = false;
const lifeObjectSpeed = 2.5; // 100% slower

// Game variables
let level = 1;
let score = 0;
let highScore = 0;
let gameStarted = false;
let loading = false;
let loadingTimeout;

// Game loop function
function gameLoop() {
    if (gameStarted) {
        if (loading) {
            drawLoadingScreen();
        } else {
            update();
            draw();
        }
    } else {
        drawStartScreen();
    }
    requestAnimationFrame(gameLoop);
}

// Update function
function update() {
    // Meme movement logic
    memeX += memeSpeed * memeDirection;
    if (memeX <= (canvas.width - canvas.width / 4) || memeX + memeWidth >= canvas.width) {
        memeDirection *= -1;
    }

    // Meme jumping logic
    if (memeJumping) {
        memeY -= 10;
        memeJumpCount++;
        if (memeJumpCount > memeJumpHeight / 10) {
            memeJumping = false;
            memeJumpCount = 0;
        }
    } else {
        if (memeY < canvas.height - memeHeight - 30) {
            memeY += 10;
        } else if (Math.random() < 0.01) {
            memeJumping = true;
        }
    }

    // Move meme lasers
    memeLasers.forEach((laser, index) => {
        laser.x -= laserSpeed;
        if (laser.x + laserLength < 0) {
            memeLasers.splice(index, 1);
        }
    });

    // Move cat lasers
    catLasers.forEach((laser, index) => {
        laser.x += laserSpeed;
        if (laser.x > canvas.width) {
            catLasers.splice(index, 1);
        }
    });

    // Character movement logic
    if (moveLeft) {
        characterX = Math.max(0, characterX - 5); // Smooth and faster movement
    }
    if (moveRight) {
        characterX = Math.min(canvas.width - characterWidth, characterX + 5); // Smooth and faster movement
    }

    // Character jumping logic
    if (jumping) {
        characterY -= 8; // 5% slower and more clean
        jumpCount++;
        if (jumpCount > jumpHeight / 8) {
            jumping = false;
            jumpCount = 0;
        }
    } else {
        if (characterY < canvas.height - characterHeight - 30) {
            characterY += 8; // 5% slower and more clean
        }
    }

    // Move life object
    if (lifeObjectFalling) {
        lifeObjectY += lifeObjectSpeed; // 100% slower
        if (lifeObjectY > canvas.height) {
            lifeObjectFalling = false;
            lifeObjectY = -lifeObjectHeight;
            lifeObjectX = Math.random() * (canvas.width / 2 - lifeObjectWidth); // Fall on the left side of the screen
        }
    }

    // Check collision between cat and life object
    if (
        characterX < lifeObjectX + lifeObjectWidth &&
        characterX + characterWidth > lifeObjectX &&
        characterY < lifeObjectY + lifeObjectHeight &&
        characterY + characterHeight > lifeObjectY
    ) {
        catLives = Math.min(9, catLives + 1);
        lifeSound.play();
        lifeObjectFalling = false;
        lifeObjectY = -lifeObjectHeight;
        lifeObjectX = Math.random() * (canvas.width / 2 - lifeObjectWidth); // Fall on the left side of the screen
    }

    // Check collision between cat lasers and meme
    catLasers.forEach((laser, index) => {
        if (
            laser.x < memeX + memeWidth &&
            laser.x + laserLength > memeX &&
            laser.y < memeY + memeHeight &&
            laser.y + laserHeight > memeY
        ) {
            // Hit detected
            memeHit++;
            catLasers.splice(index, 1);
            if (memeHit >= 20) {
                memeHit = 0;
                currentMemeIndex = (currentMemeIndex + 1) % memeImages.length;
                memeX = canvas.width - memeWidth - 20;
                memeY = canvas.height - memeHeight - 30;
                memeLasers = [];
                level++;
                if (level % 2 === 0) {
                    lifeObjectFalling = true;
                }
                loading = true;
                clearTimeout(loadingTimeout);
                loadingTimeout = setTimeout(() => {
                    loading = false;
                }, 1000); // 1 second loading time
            }
        }
    });

    // Check collision between meme lasers and cat
    memeLasers.forEach((laser, index) => {
        if (
            laser.x < characterX + characterWidth &&
            laser.x + laserLength > characterX &&
            laser.y < characterY + (crouching ? characterHeight / 2 : characterHeight) &&
            laser.y + laserHeight > characterY
        ) {
            if (!crouching) {
                // Hit detected
                catHit++;
                characterX = Math.max(0, characterX - 20); // Cat moves left when hit
            }
            memeLasers.splice(index, 1);
            if (catHit >= 9) {
                if (score > highScore) highScore = score;
                alert('Game Over!\nScore: ' + score + '\nHigh Score: ' + highScore);
                resetGame();
            }
        }
    });

    // Check collision between cat and meme
    if (
        characterX < memeX + memeWidth &&
        characterX + characterWidth > memeX &&
        characterY < memeY + memeHeight &&
        characterY + characterHeight > memeY
    ) {
        memeHit = 20;
    }
}

// Draw function
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor
    ctx.fillStyle = '#000000'; // Black color
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    // Draw character (cat)
    if (crouching) {
        ctx.drawImage(catCrouchImage, characterX, characterY + characterHeight / 2, characterWidth, characterHeight / 2);
    } else {
        ctx.drawImage(catImage, characterX, characterY, characterWidth, characterHeight);
    }

    // Draw meme
    const memeImage = new Image();
    memeImage.src = memeImages[currentMemeIndex];
    ctx.drawImage(memeImage, memeX, memeY, memeWidth, memeHeight);

    // Draw meme lasers
    ctx.fillStyle = 'red';
    memeLasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laserLength, laserHeight); // Horizontal lasers
    });

    // Draw cat lasers
    ctx.fillStyle = 'green';
    catLasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laserLength, laserHeight); // Horizontal lasers
    });

    // Draw cat lives
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Lives: ' + (9 - catHit), 10, 20);
    ctx.fillText('High Score: ' + highScore, 10, 50);

    // Draw level
    ctx.fillText('Level: ' + level, canvas.width / 2 - 30, 20);

    // Draw meme name
    ctx.fillText('Meme: ' + memeNames[currentMemeIndex], canvas.width / 2 - 50, 50);

    // Draw meme health
    ctx.fillStyle = 'red';
    ctx.fillRect(canvas.width - 150, 20, 100 * (20 - memeHit) / 20, 20); // Red bar for meme health
    ctx.fillStyle = 'black';
    ctx.fillText('Meme Health', canvas.width - 150, 15);

    // Draw life object
    if (lifeObjectFalling) {
        ctx.drawImage(lifeImage, lifeObjectX, lifeObjectY, lifeObjectWidth, lifeObjectHeight);
    }
}

// Draw start screen function
function drawStartScreen() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw start screen text
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('Press ENTER to Start', canvas.width / 2 - 150, canvas.height / 2);
}

// Draw loading screen function
function drawLoadingScreen() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw loading screen text
    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    ctx.fillText('LOADING LEVEL', canvas.width / 2 - 150, canvas.height / 2);
}

// Reset game function
function resetGame() {
    characterX = 50;
    characterY = canvas.height - characterHeight - 30;
    catHit = 0;
    memeHit = 0;
    currentMemeIndex = 0;
    memeX = canvas.width - memeWidth - 20;
    memeY = canvas.height - memeHeight - 30;
    memeLasers = [];
    catLasers = [];
    level = 1;
    score = 0;
    catLives = 9;
    gameStarted = false;
    lifeObjectFalling = false;
    lifeObjectY = -lifeObjectHeight;
    lifeObjectX = Math.random() * (canvas.width / 2 - lifeObjectWidth); // Fall on the left side of the screen
}

// Meme shooting function
function shootMemeLaser() {
    memeLasers.push({ x: memeX, y: memeY + memeHeight / 2 });
    memeShootSound.play();
}

// Cat shooting function
function shootCatLaser() {
    catLasers.push({ x: characterX + characterWidth, y: characterY + characterHeight / 2 });
    catShootSound.play();
}

// Keyboard event listeners
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowUp' && !jumping) {
        jumping = true;
    } else if (event.key === 'ArrowLeft') {
        moveLeft = true;
    } else if (event.key === 'ArrowRight') {
        moveRight = true;
    } else if (event.key === 'ArrowDown') {
        crouching = true;
    } else if (event.key === ' ') {
        shootCatLaser();
    } else if (event.key === 'Enter' && !gameStarted) {
        gameStarted = true;
        backgroundMusic.play(); // Play background music
        memeShootInterval = setInterval(shootMemeLaser, 2000);
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'ArrowLeft') {
        moveLeft = false;
    } else if (event.key === 'ArrowRight') {
        moveRight = false;
    } else if (event.key === 'ArrowDown') {
        crouching = false;
    }
});

// Start the game loop
gameLoop();
