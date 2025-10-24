// Глобальні змінні
var myCar;
let score=0;
let obstacles=[];
let frameCount=0;
let gameOver=false;

// Ігрова зона
var myGameArea={
    canvas: document.getElementById("canvas"),
    start: function() {
        this.canvas.width=480;
        this.canvas.height=270;
        this.context=this.canvas.getContext("2d");
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    update: function() {
        this.clear();
        myCar.update();
        obstacles.forEach(obs => obs.update());
    }
};

// Клас автомобіля
class Car {
    constructor(width, height, color, x, y) {
        this.width=width;
        this.height=height;
        this.color=color;
        this.x=x;
        this.y=y;
        this.speed=0;
        this.angle=0;
        this.maxSpeed=3;
        this.acceleration=0.1;
        this.friction=0.05;
    }

    update() {
        const ctx=myGameArea.context;

        this.speed*=(1-this.friction);
        if (this.speed>this.maxSpeed) this.speed=this.maxSpeed;
        if (this.speed<-this.maxSpeed) this.speed=-this.maxSpeed;

        this.x+=Math.cos(this.angle)*this.speed;
        this.y+=Math.sin(this.angle)*this.speed;

        if (this.x<0) this.x=0;
        if (this.x>myGameArea.canvas.width-this.width) this.x=myGameArea.canvas.width-this.width;
        if (this.y<0) this.y=0;
        if (this.y>myGameArea.canvas.height-this.height) this.y=myGameArea.canvas.height-this.height;

        ctx.save();
        ctx.translate(this.x+this.width/2, this.y+this.height/2);
        ctx.rotate(this.angle);

        ctx.fillStyle=this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        ctx.fillStyle="#87CEEB"; // вікна
        ctx.fillRect(-this.width/2+5, -this.height/2+3, this.width-10, this.height-6);

        ctx.fillStyle="#333"; // колеса
        ctx.fillRect(-this.width/2-2, -this.height/2-2, 4, 4);
        ctx.fillRect(this.width/2-2, -this.height/2-2, 4, 4);
        ctx.fillRect(-this.width/2-2, this.height/2-2, 4, 4);
        ctx.fillRect(this.width/2-2, this.height/2-2, 4, 4);

        ctx.restore();
    }

    accelerate() { this.speed+=this.acceleration; }
    brake() { this.speed-=this.acceleration; }
    turnLeft() { this.angle-=0.1; }
    turnRight() { this.angle+=0.1; }

    honk() {
        try {
            const audioContext=new (window.AudioContext || window.webkitAudioContext)();
            const oscillator=audioContext.createOscillator();
            const gainNode=audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime+0.1);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime+0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime+0.3);

            oscillator.type='sawtooth';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime+0.3);
        } catch (error) {
            console.log('Не вдалося відтворити звук клаксона:', error);
        }
    }
}

// Клас перешкоди
class Obstacle {
    constructor(x, y, width, height, color) {
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.color=color;
        this.speed=2;
    }

    update() {
        const ctx=myGameArea.context;
        this.y+=this.speed;
        ctx.fillStyle=this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(car) {
        return !(
            car.x>this.x+this.width ||
            car.x+car.width<this.x ||
            car.y>this.y+this.height ||
            car.y+car.height<this.y
        );
    }
}

// Керування
const keys={ up:false, down:false, left:false, right:false, honk:false };
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': keys.up = true; break;
        case 'arrowdown': case 's': keys.down = true; break;
        case 'arrowleft': case 'a': keys.left = true; break;
        case 'arrowright': case 'd': keys.right = true; break;
        case ' ': case 'h': if(!keys.honk){ keys.honk = true; myCar.honk(); } break;
    }
});
document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': keys.up = false; break;
        case 'arrowdown': case 's': keys.down = false; break;
        case 'arrowleft': case 'a': keys.left = false; break;
        case 'arrowright': case 'd': keys.right = false; break;
        case ' ': case 'h': keys.honk = false; break;
    }
});

// Малювання очок
function drawScore() {
    const ctx=myGameArea.context;
    ctx.font="20px Arial";
    ctx.fillStyle="black";
    ctx.fillText("Очки: " + score, 10, 30);
}

// Оновлення перешкод
function updateObstacles() {
    if(gameOver) return;

    frameCount++;
    if(frameCount % 100 === 0){
        const width=50;
        const height=20;
        const x=Math.random()*(myGameArea.canvas.width - width);
        obstacles.push(new Obstacle(x, -height, width, height, "green"));
    }

    obstacles.forEach((obs, index) => {
        obs.update();
        if(obs.checkCollision(myCar)){
            gameOver=true;
        }
        if(obs.y > myGameArea.canvas.height) obstacles.splice(index, 1);
    });
}

// Головний цикл
function gameLoop() {
    if(gameOver){
        const ctx=myGameArea.context;
        ctx.font="30px Arial";
        ctx.fillStyle="red";
        ctx.fillText("Гра завершена!", 90, 130);
        ctx.fillText("Очки: " + score, 150, 170);

        // Додаємо кнопку перезапуску
        if(!document.getElementById("restartBtn")){
            const btn=document.createElement("button");
            btn.id="restartBtn";
            btn.textContent="Перезапустити гру";
            btn.style.position="absolute";
            btn.style.left="180px";
            btn.style.top="200px";
            btn.onclick=()=>location.reload();
            document.body.appendChild(btn);
        }
        return; // зупиняємо цикл
    }

    if(keys.up) myCar.accelerate();
    if(keys.down) myCar.brake();
    if(keys.left) myCar.turnLeft();
    if(keys.right) myCar.turnRight();

    score++;
    updateObstacles();
    myGameArea.update();
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Старт гри
window.onload = () => {
    myGameArea.start();
    myCar=new Car(40, 20, "red", 240, 200);
    gameLoop();
};
