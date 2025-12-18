<script setup>
/**
 * Корневой компонент приложения.
 * Собирает вместе основные части интерфейса:
 * - AnimatedBackground: анимированный фон с частицами
 * - MainVue: основной интерфейс обменника
 */
import AnimatedBackground from './components/AnimatedBackground.vue'
import MainVue from './components/MainVue.vue'
</script>

<template>
  <!-- Фоновый компонент (рендерится на заднем плане благодаря z-index в его стилях) -->
  <AnimatedBackground />
  
  <!-- Основной контент приложения -->
  <MainVue />
</template>

