<script setup lang="ts">
import Grid from '~/razomy/ui-vue/layout/Grid.vue';
import Card from '~/razomy/ui-vue/card/Card.vue';
import Body from '~/razomy/ui-vue/typography/Body.vue';
import Alert from '~/razomy/ui-vue/alert/Alert.vue';
import Divider from '~/razomy/ui-vue/divider/Divider.vue';
import TextInput from '~/razomy/ui-vue/input/TextInput.vue';

defineProps<{
  user?: { id: number; name: string; role: string } | null;
}>();
</script>

<template>
  <Grid variant="y" gap="sm">
    <Alert v-if="!user" type="info">
      Выберите запись в таблице или карточках, чтобы увидеть детали и отредактировать поля.
    </Alert>

    <Card v-else padding="md" gap="sm">
      <Body variant="xxsMono" color="primary" uppercase>ID: #{{ user.id }}</Body>
      <Body variant="lgBold">{{ user.name }}</Body>
      <Body variant="sRegular" color="muted">{{ user.role }}</Body>

      <Divider />

      <TextInput
        v-model="user.name"
        label="Быстрое редактирование имени"
      />
    </Card>
  </Grid>
</template>
