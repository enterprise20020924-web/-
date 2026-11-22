<template>
  <div class="reload-welcome-art" aria-hidden="true">
    <svg viewBox="0 0 560 520" fill="none">
      <circle cx="330" cy="240" r="212" fill="#b1faff" />
      <circle cx="330" cy="240" r="236" stroke="#b1faff" stroke-width="2" stroke-dasharray="200 16 2 16" />
      <path fill="#fff" d="m20 302 529-188-64 75L0 357z" />
      <path fill="#091b9b" d="m0 430 550-150v65L0 501z" />
      <path fill="#fff" d="m76 417 431-113-18 15L61 433z" />
      <path fill="#f43252" d="m430 84 38-43-12 56zM60 361l26-35-5 51z" />
      <g stroke="#fff" stroke-width="3"><path d="M468 240h36m-18-18v36M100 156h24m-12-12v24" /></g>
    </svg>
    <img class="reload-welcome-mascot reload-welcome-amane" :src="mascotUrls[0]" alt="" draggable="false" />
    <img class="reload-welcome-mascot reload-welcome-alice" :src="mascotUrls[1]" alt="" draggable="false" />
    <span class="reload-welcome-art-word">BEGIN.</span>
    <span class="reload-welcome-art-caption">AMAMI / NEW CHAPTER</span>
  </div>
</template>

<script setup lang="ts">
const mascotUrls = [
  'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/全身立绘/猫arc天音.png',
  'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/全身立绘/爱丽丝教师装.png',
];
</script>
