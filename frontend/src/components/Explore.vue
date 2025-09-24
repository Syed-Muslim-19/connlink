<script setup>
import ExploreFeed from "./ExploreFeed.vue";
</script>

<template>
  <div class="flex h-full">
    <!-- Main Content Area (Explore Feed - Discover new posts) -->
    <div class="flex-1 max-w-2xl mx-auto">
      <!-- Page Header -->
      <div class="px-4 py-6 border-b border-gray-200 mb-4">
        <h1 class="text-2xl font-bold text-gray-900">Explore</h1>
        <p class="text-gray-600 mt-1">
          Discover posts from users around the community
        </p>
      </div>

      <!-- Explore Feed -->
      <div class="px-4">
        <ExploreFeed />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
