<template>
  <div
    v-if="isVerified"
    class="inline-flex items-center justify-center ml-1 tooltip"
    :title="'Verified user'"
  >
    <svg
      :class="size === 'small' ? 'w-4 h-4' : 'w-5 h-5'"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      class="text-blue-500"
    >
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
</template>

<script setup>
const props = defineProps({
  isVerified: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'normal', // 'small' or 'normal'
    validator: (value) => ['small', 'normal'].includes(value)
  }
});
</script>

<style scoped>
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 1;
  pointer-events: none;
}

.tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
}

.tooltip:hover::before {
  opacity: 1;
}
</style>