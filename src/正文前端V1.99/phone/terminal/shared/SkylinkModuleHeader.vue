<template>
  <header class="sk-module-banner">
    <div>
      <span class="sk-kicker">{{ code }} / {{ label }}</span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <span class="sk-module-symbol" aria-hidden="true"><i :class="icon"></i></span>
  </header>
</template>

<script setup lang="ts">
defineProps<{ code: string; label: string; title: string; description: string; icon: string }>();
</script>
