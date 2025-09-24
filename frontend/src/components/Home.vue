<script setup>
import HomeFeed from "./HomeFeed.vue";
import RightSideBar from "./RightSidebar.vue";
</script>

<template>
  <div class="flex h-full">
    <!-- Main Content Area (Home Feed - Posts from followed users) -->
    <div class="flex-1 max-w-2xl mx-auto">
      <HomeFeed />
    </div>

    <!-- Right Sidebar -->
    <div class="hidden lg:block w-80 flex-shrink-0 p-4">
      <RightSideBar />
    </div>
  </div>
</template>

<style scoped></style>
