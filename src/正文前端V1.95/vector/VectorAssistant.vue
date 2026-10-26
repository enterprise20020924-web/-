<template>
  <svg
    class="bpv-assistant"
    :class="`is-${variant}`"
    viewBox="0 0 240 310"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="`${uid}-hair`" x1="78" y1="46" x2="162" y2="156" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--assistant-light)" />
        <stop offset="1" stop-color="var(--assistant-dark)" />
      </linearGradient>
      <linearGradient :id="`${uid}-coat`" x1="88" y1="161" x2="157" y2="264" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" />
        <stop offset="1" stop-color="#d7edff" />
      </linearGradient>
    </defs>
    <ellipse cx="121" cy="293" rx="62" ry="9" fill="#198ce9" opacity=".08" />
    <path d="M48 288 121 269 194 288 121 307Z" fill="#e8f7ff" stroke="#9ed7fa" />
    <path d="m69 289 52-13 51 13-51 13Z" stroke="#ffffff" stroke-width="3" />
    <g class="bpv-assistant-body">
      <g class="bpv-assistant-halo">
        <ellipse cx="120" cy="31" rx="49" ry="12" stroke="var(--assistant-accent)" stroke-width="3" />
        <ellipse cx="120" cy="31" rx="38" ry="7" stroke="var(--assistant-accent)" opacity=".4" />
        <path d="m116 17 4-7 4 7m-8 28 4 7 4-7" stroke="var(--assistant-accent)" stroke-width="2" />
        <path d="M68 31h-7m111 0h7" stroke="var(--assistant-accent)" stroke-width="2" />
      </g>
      <path
        d="M59 111c-12 40 1 75 16 91l10-21 3 24 19-42h32l20 42 4-27 18 17c6-29 10-69-3-94Z"
        :fill="`url(#${uid}-hair)`"
        stroke="#77b6d9"
        stroke-width="2"
      />
      <path d="m96 246 3 35 15 4 4-38m13 0 2 34 15 3 4-39" fill="#eff9ff" stroke="#8fbcd4" stroke-width="2" />
      <path d="m99 267 16 3-1 15-21 2c-4-4-2-10 6-11Zm34 2 16 1 7 10c4 6-2 10-9 8l-15-3Z" fill="#244a6c" />
      <path d="m89 248 28 2 5-21 5 21 27-1-7-36H97Z" fill="#214768" stroke="#456787" stroke-width="2" />
      <path
        d="M91 154c-13 8-19 30-26 52l22 13 9-25-5 51c18 11 45 14 68 0l-7-51 12 20 17-10c-8-20-14-39-32-49Z"
        :fill="`url(#${uid}-coat)`"
        stroke="#81b4d2"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path d="m92 157 28 15 28-15-8 28-20 10-20-10Z" fill="#197ace" />
      <path d="m99 158 21 13 21-13m-39 18 18 10 18-10" stroke="#e3f8ff" stroke-width="3" />
      <path d="m120 178-15 7 7 9 8-9 8 9 8-9Z" fill="#f29bc2" stroke="#d77ba8" />
      <path d="m111 192 9-7 9 7-7 12Z" fill="#8bd5f7" />
      <path d="m95 222 2 17m-9-11 8 1m49-10 2 19m-10-9 9-1" stroke="#9bc9e5" stroke-width="2" />
      <path d="M75 199c-6 0-11 7-8 14 3 9 12 11 18 6l4-15Z" fill="#ffe6dd" stroke="#dcaeb1" stroke-width="2" />
      <path d="M165 192c3-9 8-12 13-7 2 3 0 8-2 13l5 6-8 11-11-11Z" fill="#ffe6dd" stroke="#dcaeb1" stroke-width="2" />
      <g transform="rotate(-13 77 209)">
        <rect x="49" y="183" width="51" height="58" rx="6" fill="#244e75" stroke="#96d7f7" stroke-width="3" />
        <rect x="54" y="188" width="41" height="46" rx="3" fill="#dff6ff" />
        <path d="m74 195 13 10-13 18-12-18Z" fill="#259af0" />
        <path d="m74 201-6 7 6 9 7-9Z" fill="#b4edff" />
        <path d="M66 229h18" stroke="#7cc7eb" stroke-width="2" />
      </g>
      <path
        d="M74 76c11-31 76-32 93-1l7 38c-4 33-23 52-54 52-33 0-53-23-55-49Z"
        fill="#fff0e7"
        stroke="#d5a9ad"
        stroke-width="2"
      />
      <path
        d="M65 117c-11-35-6-63 20-73 19-8 58-10 78 11 16 16 21 44 8 68l-7-24-8 20-6-35-13 24-12-27-15 28-10-23-25 37 4-29-9 35Z"
        :fill="`url(#${uid}-hair)`"
        stroke="#78b9db"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M76 72c10-19 31-25 51-24M85 58l-7 13m61-19c14 4 24 15 27 27"
        stroke="#e9faff"
        stroke-width="4"
        stroke-linecap="round"
        opacity=".8"
      />
      <path
        d="M99 61c4 10 5 21 3 29m26-40c2 13-1 25-5 33m29-25c7 14 8 26 5 35"
        stroke="#e5f8ff"
        stroke-width="2"
        opacity=".7"
      />
      <g class="bpv-assistant-eyes">
        <path d="M87 122c5-4 12-4 17-1m31 0c5-4 12-3 17 1" stroke="#376086" stroke-width="3" stroke-linecap="round" />
        <ellipse cx="97" cy="130" rx="6" ry="10" fill="#217fbe" />
        <ellipse cx="143" cy="130" rx="6" ry="10" fill="#217fbe" />
        <ellipse cx="97" cy="134" rx="4" ry="5" fill="#50c5ee" />
        <ellipse cx="143" cy="134" rx="4" ry="5" fill="#50c5ee" />
        <circle cx="95" cy="126" r="2.5" fill="white" />
        <circle cx="141" cy="126" r="2.5" fill="white" />
      </g>
      <path d="M116 146q5 5 10-1" stroke="#b57985" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="82" cy="140" rx="8" ry="3" fill="#efaec0" opacity=".5" />
      <ellipse cx="158" cy="140" rx="8" ry="3" fill="#efaec0" opacity=".5" />
      <path
        d="m170 72 3-10 5 9 11-1-8 8 4 10-10-5-8 6 1-11-8-6Z"
        fill="#fff"
        stroke="var(--assistant-accent)"
        stroke-width="2"
      />
      <path d="m177 91 5 16-9-5-5 9 1-19" fill="#a2dcf6" />
    </g>
    <g class="bpv-assistant-spark" stroke="var(--assistant-accent)" stroke-width="2" stroke-linecap="round">
      <path d="M31 111v12m-6-6h12M200 174v10m-5-5h10" />
      <circle cx="196" cy="93" r="3" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
withDefaults(defineProps<{ variant?: 'blue' | 'silver' }>(), { variant: 'blue' });
const uid = useId();
</script>

<style>
.bpv-assistant {
  --assistant-light: #d3f2ff;
  --assistant-dark: #77c3eb;
  --assistant-accent: #38b4ee;
  overflow: visible;
}
.bpv-assistant.is-silver {
  --assistant-light: #f6faff;
  --assistant-dark: #c5d2e5;
  --assistant-accent: #99a7e1;
}
.bpv-assistant-body {
  animation: bpv-assistant-float 5s ease-in-out infinite;
  transform-origin: 120px 220px;
}
.bpv-assistant-halo {
  animation: bpv-halo-drift 5s ease-in-out infinite;
  transform-origin: 120px 31px;
}
.bpv-assistant-eyes {
  animation: bpv-blink 6.5s infinite;
  transform-origin: 120px 130px;
}
.bpv-assistant-spark {
  animation: bpv-spark 3.2s ease-in-out infinite;
}
@keyframes bpv-assistant-float {
  50% {
    transform: translateY(-5px) rotate(1deg);
  }
}
@keyframes bpv-halo-drift {
  50% {
    transform: translateY(-3px) rotate(-4deg);
  }
}
@keyframes bpv-blink {
  0%,
  43%,
  47%,
  100% {
    transform: scaleY(1);
  }
  45% {
    transform: scaleY(0.05);
  }
}
@keyframes bpv-spark {
  50% {
    opacity: 0.3;
  }
}
</style>
