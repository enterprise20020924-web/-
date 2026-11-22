<template>
  <div class="reload-dial" :aria-label="`填报进度 ${current} / ${total}`">
    <svg viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <circle cx="70" cy="70" r="61" stroke="currentColor" stroke-opacity=".15" />
      <circle cx="70" cy="70" r="54" stroke="currentColor" stroke-opacity=".18" stroke-width="6" />
      <circle
        cx="70"
        cy="70"
        r="54"
        stroke="currentColor"
        stroke-width="6"
        pathLength="100"
        :stroke-dasharray="`${(current / total) * 100} 100`"
        transform="rotate(-90 70 70)"
      />
      <path d="M70 3v12M70 125v12M3 70h12M125 70h12" stroke="currentColor" stroke-width="2" />
      <path d="m111 16 12 13-19-5z" fill="#f43252" />
    </svg>
    <strong
      >{{ String(current).padStart(2, '0') }}<small>/ {{ String(total).padStart(2, '0') }}</small></strong
    >
    <span>ADMISSION</span>
  </div>
</template>
<script setup lang="ts">
defineProps<{ current: number; total: number }>();
</script>
