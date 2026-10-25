<script setup lang="ts">
import TabContainer from "~/razomy/tab/TabContainer.vue";
</script>

<template>
  <rzm-default-layout>
    <TabContainer>
      <slot></slot>
    </TabContainer>
  </rzm-default-layout>
</template>

<style scoped>
</style>
