<script setup>
import LeftSidebar from "./LeftSidebar.vue";
</script>

<template>
  <div class="flex h-screen">
    <LeftSidebar />
    <div class="flex-1 overflow-y-auto pb-20 md:pb-0">
      <router-view />
    </div>
  </div>
</template>

<style scoped></style>
