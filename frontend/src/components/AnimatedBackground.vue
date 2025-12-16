<template>
  <div class="animated-background">
    <!-- Частицы будут созданы динамически -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

// Конфигурация частиц
const config = {
  particleCount: 60,         // Количество частиц
  maxParticleSize: 4,        // Максимальный размер частицы
  minSpeed: 0.2,             // Минимальная скорость
  maxSpeed: 0.6,             // Максимальная скорость
  lineMaxDistance: 150,      // Максимальное расстояние для соединения линиями
  lineColor: 'rgba(255, 255, 255, 0.1)' // Цвет соединительных линий
};

let particles = [];
let animationId = null;
let container = null;
let ctx = null;
let width = 0;
let height = 0;

// Класс частицы
class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * config.maxParticleSize + 1;
    this.speedX = (Math.random() - 0.5) * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    this.speedY = (Math.random() - 0.5) * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Отскок от границ
    if (this.x > width) this.speedX = -Math.abs(this.speedX);
    if (this.x < 0) this.speedX = Math.abs(this.speedX);
    if (this.y > height) this.speedY = -Math.abs(this.speedY);
    if (this.y < 0) this.speedY = Math.abs(this.speedY);
  }

  draw() {
    if (!ctx) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Инициализация
function init() {
  if (!container) return;

  // Создаем canvas
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  // Устанавливаем размеры
  function resize() {
    width = canvas.width = container.clientWidth;
    height = canvas.height = container.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Создаем частицы
  particles = [];
  for (let i = 0; i < config.particleCount; i++) {
    particles.push(new Particle());
  }

  // Запускаем анимацию
  animate();

  // Очистка при размонтировании
  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    if (container && canvas) container.removeChild(canvas);
  });
}

// Анимация
function animate() {
  if (!ctx) return;

  // Очищаем с прозрачностью для эффекта шлейфа
  ctx.fillStyle = 'rgba(24, 24, 24, 0.05)';
  ctx.fillRect(0, 0, width, height);

  // Рисуем градиентный фон
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#181818');
  gradient.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Обновляем и рисуем частицы
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  // Рисуем соединительные линии
  drawLines();

  animationId = requestAnimationFrame(animate);
}

// Рисуем линии между близкими частицами
function drawLines() {
  if (!ctx) return;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < config.lineMaxDistance) {
        const opacity = 1 - (distance / config.lineMaxDistance);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

// Инициализируем после монтирования компонента
onMounted(() => {
  container = document.querySelector('.animated-background');
  if (container) init();
});
</script>

<style scoped>
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* Фон позади контента */
  overflow: hidden;
}
</style>
