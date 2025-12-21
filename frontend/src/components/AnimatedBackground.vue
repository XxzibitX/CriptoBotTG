<template>
  <div class="animated-background">
    <!-- Canvas для отрисовки частиц будет добавлен сюда программно -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

// Конфигурация частиц (адаптивная для мобильных устройств)
const getParticleConfig = () => {
  const isMobile = window.innerWidth < 768;
  return {
    particleCount: isMobile ? 40 : 60,         // Количество частиц (меньше на мобильных для производительности)
    maxParticleSize: isMobile ? 3 : 4,         // Максимальный размер частиц
    minSpeed: 0.2,                             // Минимальная скорость движения
    maxSpeed: 0.6,                             // Максимальная скорость движения
    lineMaxDistance: isMobile ? 100 : 150,     // Расстояние, при котором частицы соединяются линиями
    lineColor: 'rgba(255, 255, 255, 0.1)'      // Цвет соединительных линий
  };
};

let config = getParticleConfig();

// Переменные состояния анимации
let particles = [];
let animationId = null;
let container = null;
let ctx = null;
let width = 0;
let height = 0;

/**
 * Класс, представляющий отдельную частицу
 */
class Particle {
  constructor() {
    // Случайная начальная позиция
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    // Случайный размер
    this.size = Math.random() * config.maxParticleSize + 1;
    // Случайная скорость и направление
    this.speedX = (Math.random() - 0.5) * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    this.speedY = (Math.random() - 0.5) * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    // Случайная прозрачность
    this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
  }

  // Обновление позиции частицы
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Отскок от границ экрана
    if (this.x > width) this.speedX = -Math.abs(this.speedX);
    if (this.x < 0) this.speedX = Math.abs(this.speedX);
    if (this.y > height) this.speedY = -Math.abs(this.speedY);
    if (this.y < 0) this.speedY = Math.abs(this.speedY);
  }

  // Отрисовка частицы
  draw() {
    if (!ctx) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Инициализация анимации
 */
function init() {
  if (!container) return;

  // Создаем элемент canvas
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  // Функция изменения размеров canvas при изменении окна
  function resize() {
    // Используем размеры окна для полного покрытия
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Устанавливаем CSS размеры
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  resize();
  
  // Обработчик изменения размера окна
  const resizeHandler = () => {
    resize();
    // Обновляем конфигурацию (например, если перешли с десктопа на мобильный)
    config = getParticleConfig();
    // Ограничиваем позиции частиц новыми размерами, чтобы они не улетели за экран
    particles.forEach(particle => {
      particle.x = Math.min(particle.x, width);
      particle.y = Math.min(particle.y, height);
    });
  };
  
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeHandler, 100); // Задержка для корректного определения размеров после поворота
  });

  // Создаем массив частиц
  particles = [];
  for (let i = 0; i < config.particleCount; i++) {
    particles.push(new Particle());
  }

  // Запускаем цикл анимации
  animate();

  // Очистка ресурсов при размонтировании компонента
  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('orientationchange', resizeHandler);
    if (container && canvas && container.contains(canvas)) {
      container.removeChild(canvas);
    }
  });
}

/**
 * Цикл анимации
 */
function animate() {
  if (!ctx) return;

  // Очищаем canvas с небольшой прозрачностью для создания эффекта шлейфа
  ctx.fillStyle = 'rgba(24, 24, 24, 0.05)';
  ctx.fillRect(0, 0, width, height);

  // Рисуем градиентный фон
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#181818');
  gradient.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Обновляем и рисуем каждую частицу
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  // Рисуем соединительные линии между близкими частицами
  drawLines();

  // Запрашиваем следующий кадр анимации
  animationId = requestAnimationFrame(animate);
}

/**
 * Рисуем линии между частицами, которые находятся близко друг к другу
 */
function drawLines() {
  if (!ctx) return;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Если расстояние меньше максимального, рисуем линию
      if (distance < config.lineMaxDistance) {
        // Прозрачность линии зависит от расстояния (чем ближе, тем ярче)
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

// Запускаем инициализацию после монтирования компонента
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
  width: 100vw;
  height: 100vh;
  min-width: 100%;
  min-height: 100%;
  z-index: -1; /* Фон должен быть позади контента */
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Убеждаемся, что canvas занимает весь контейнер */
.animated-background canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
