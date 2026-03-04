<template>
  <div style="padding: 2rem;">
    <h2>Список пользователей из PostgreSQL</h2>

    <!-- Таблица PrimeVue -->
    <DataTable
        :value="users"
        :loading="pending"
        tableStyle="min-width: 50rem"
        stripedRows
    >
      <template #empty> Пользователи не найдены. </template>
      <template #loading> Загрузка данных... </template>

      <Column field="id" header="ID" sortable></Column>
      <Column field="name" header="Имя" sortable></Column>
      <Column field="createdAt" header="Дата регистрации">
        <template #body="slotProps">
          {{ new Date(slotProps.data.createdAt).toLocaleDateString('ru-RU') }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
// Делаем запрос к нашему внутреннему API
const { data: users, pending } = await useFetch('/api/fs/children')
</script>

<style>
/* Базовый сброс стилей (по желанию) */
body {
  font-family: var(--font-family);
  margin: 0;
  background-color: var(--surface-ground);
  color: var(--text-color);
}
</style>