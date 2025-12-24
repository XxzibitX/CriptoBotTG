<script setup>
/**
 * Корневой компонент приложения.
 * Собирает вместе основные части интерфейса:
 * - AnimatedBackground: анимированный фон с частицами
 * - RouterView: отображает текущую страницу (Home или Admin)
 */
import AnimatedBackground from './components/AnimatedBackground.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Фоновый компонент (рендерится на заднем плане благодаря z-index в его стилях) -->
  <AnimatedBackground />

  <!-- Основной контент приложения (меняется в зависимости от роута) -->
  <RouterView />
</template>

