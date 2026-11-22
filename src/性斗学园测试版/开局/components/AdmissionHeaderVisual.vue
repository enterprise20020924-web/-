<template>
  <div class="sk-enrollment-visual" aria-hidden="true">
    <span class="sk-enrollment-baseline"></span>
    <span class="sk-enrollment-spark sk-enrollment-spark-a"></span>
    <span class="sk-enrollment-spark sk-enrollment-spark-b"></span>
    <div class="sk-enrollment-sheet-back"></div>
    <div class="sk-enrollment-sheet">
      <div class="sk-enrollment-sheet-content">
        <div class="sk-enrollment-paper-lines">
          <span></span><span></span><span></span>
          <i class="sk-document-bars"></i>
        </div>
        <div class="sk-enrollment-page-number">
          <strong>{{ String(current).padStart(2, '0') }}</strong>
          <small>/ {{ String(total).padStart(2, '0') }}</small>
        </div>
      </div>
      <span class="sk-enrollment-sheet-corner"></span>
    </div>
    <AmamiMark />
    <div class="sk-enrollment-step-marks">
      <span v-for="index in total" :key="index" :class="{ 'is-reached': index <= current }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AmamiMark from './AmamiMark.vue';

defineProps<{ current: number; total: number }>();
</script>
