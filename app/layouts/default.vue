<script setup lang="ts">
import Grid from '~/razomy/ds-vue/layout/Grid.vue';
import Nav from '~/components/Nav.vue';
</script>

<template>
  <rzm-default-layout>
    <Grid variant="y_header_main" surface="background" full-height clip class="ds-ide-shell">
      <Nav />
      <Grid as="main" variant="full" full-height clip>
        <slot />
      </Grid>
    </Grid>
  </rzm-default-layout>
</template>

<style scoped>
.ds-ide-shell {
  height: 100vh;
  width: 100vw;
}
</style>
