<script setup>
import '~/assets/css/main.css';
</script>

<template>
  <rzm-default-app class="app-root-container">
      <slot />
  </rzm-default-app>
</template>

<style scoped>
.app-root-container {
  min-height: 100vh;
}
</style>
