<template>
  <div v-if="accessGranted">
    <!-- Твоя админка -->
    <h1>📊 Админка</h1>
    <p>Тут будет твоя админ-панель</p>
  </div>

  <div v-else-if="loading">
    Проверка доступа...
  </div>

  <div v-else class="access-denied">
    <h2>🚫 Доступ запрещён</h2>
    <p>Эта страница только для администраторов</p>
    <button @click="$router.push('/')">На главную</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTelegram } from '../composables/useTelegram.js';

const router = useRouter();
const { isTelegram, user: telegramUser } = useTelegram();

const accessGranted = ref(false);
const loading = ref(true);

onMounted(async () => {
  // 1. Проверяем, что в Telegram
  if (!isTelegram.value) {
    alert('Только через Telegram бота');
    router.push('/');
    return;
  }

  // 2. Отправляем ID на бэкенд для проверки
  try {
    const response = await fetch('/api/auth/check-admin', {
      headers: {
        'X-Telegram-User-ID': telegramUser.value.id.toString()
      }
    });

    if (response.ok) {
      // 3. Бэкенд разрешил → показываем админку
      accessGranted.value = true;
    } else {
      // 4. Бэкенд запретил → ошибка
      const error = await response.json();
      console.error('Доступ запрещён:', error.message);
      // Авто-редирект через 2 секунды
      // setTimeout(() => router.push('/'), 2000);
    }
  } catch (error) {
    console.error('Ошибка проверки:', error);
    router.push('/');
  } finally {
    loading.value = false;
  }
});
</script>
