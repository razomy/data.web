<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import {Grid} from '@razomy/vue';
import {Card} from '@razomy/vue';
import {Body} from '@razomy/vue';
import {Button} from '@razomy/vue';
import {Badge} from '@razomy/vue';
import {TextInput} from '@razomy/vue';
import {AppCopyBtn} from '@razomy/vue';
import type {TableDeclaration} from "@razomy/sql";

export interface FilterOption {
  label: string;
  value: string;
  role?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  dot?: boolean;
}

const props = defineProps<{
  /** Декларация таблицы из @razomy/sql */
  schema: TableDeclaration<any>;
  /** Массив записей */
  records: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  loading?: boolean;
  selectedId?: string | number;

  /** Опциональная быстрая фильтрация (например, по category) */
  filterField?: string;
  filterValue?: string;
  filterOptions?: FilterOption[];

  /** Показывать ли кнопку создания MR */
  allowMr?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'update:filterValue', val: string): void;
  (e: 'update:pageSize', val: number): void;
  (e: 'page-change', page: number): void;
  (e: 'toggle-sort', field: string): void;
  (e: 'inspect', item: T): void;
  (e: 'propose-mr', item: T): void;
  (e: 'refresh'): void;
}>();

// 1. Вычисляем Primary Key таблицы (например: 'extension', 'alpha2', 'codePoint')
const primaryKey = computed(() => {
  const keys = Object.keys(props.schema.primary || {});
  return keys[0] || 'id';
});

// 2. Генерируем колонки из schema.record
const columns = computed(() => {
  const recordSpec = props.schema.record || {};
  const primarySpec = props.schema.primary || {};
  const indexSpec = props.schema.index || {};

  return Object.entries(recordSpec).map(([key, def]: [string, any]) => {
    // Превращаем camelCase в человекочитаемый UPPER CASE (например, currencyCode -> CURRENCY CODE)
    const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();

    return {
      key,
      label,
      def,
      isPrimary: !!primarySpec[key],
      isIndexed: !!indexSpec[key],
      isBoolean: def?.type === 'Boolean' || def === 'BOOL' || key.startsWith('is') || key.startsWith('has'),
      isArray: !!def?.isArray || key === 'extensions' || key === 'countries',
      isI18n: key === 'i18n',
      isColor: key === 'hexCode',
      isUrl: key.toLowerCase().includes('url'),
      isGlyph: key === 'glyph' || key === 'symbol',
    };
  });
});

// Получение значения первичного ключа для строки
function getRowKey(item: T): string {
  return String(item[primaryKey.value] ?? JSON.stringify(item));
}

// Форматирование заголовка фильтра
const filterLabel = computed(() => {
  if (!props.filterField) return 'FILTER:';
  return `${props.filterField.replace(/([A-Z])/g, ' $1').toUpperCase()}:`;
});
</script>

<template>
  <Grid variant="y" gap="md" padding="md" scrollable full-height>
      <!-- Header -->
      <Grid variant="x_between" padding="md" border="b">
        <Grid variant="y" gap="xss">
          <Grid variant="x" gap="xs">
            <Body variant="lgBold">{{ schema.title }}</Body>
            <Badge :label="`${total.toLocaleString()} records`" role="primary" />
            <Badge :label="schema.name_" role="secondary" />
          </Grid>
          <Body variant="xxsMono" color="muted">
          {{ schema.description || 'Click any record to inspect details' }}
          </Body>
        </Grid>

<!--        <Grid variant="x" gap="xs">-->
<!--          <TextInput-->
<!--            :model-value="search"-->
<!--            :placeholder="`Search in ${schema.title.toLowerCase()}...`"-->
<!--            icon="mdi-magnify"-->
<!--            clearable-->
<!--            @update:model-value="emit('update:search', $event)"-->
<!--            @clear="emit('update:search', '')"-->
<!--          />-->
<!--          <Button-->
<!--            icon="mdi-refresh"-->
<!--            variant="tonal"-->
<!--            color="primary"-->
<!--            size="sm"-->
<!--            :loading="loading"-->
<!--            @click="emit('refresh')"-->
<!--          />-->
<!--        </Grid>-->
      </Grid>

      <!-- Dynamic Filter Bar (рендерится только если переданы filterOptions) -->
      <Grid
        v-if="filterOptions && filterOptions.length > 0"
        variant="x_between"
        padding="sm"
        surface="panel"
        border="b"
      >
        <Grid variant="x_start" gap="xs" wrap>
          <Body variant="xxsMono" color="muted">{{ filterLabel }}</Body>
          <Badge
            v-for="opt in filterOptions"
            :key="opt.value"
            :label="opt.label"
            :role="opt.role || 'primary'"
            :active="filterValue === opt.value"
            :dot="opt.dot"
            clickable
            @click="emit('update:filterValue', opt.value)"
          />
        </Grid>

        <Grid variant="x" gap="xs">
          <Body variant="xxsMono" color="muted">Page {{ page }} / {{ totalPages || 1 }}</Body>
        </Grid>
      </Grid>

      <!-- Data Table -->
      <v-table hover density="compact">
        <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            style="cursor: pointer; user-select: none"
            @click="emit('toggle-sort', col.key)"
          >
            <Grid variant="x_start" gap="xss">
              <!-- Иконка для Primary Key -->
              <v-icon
                v-if="col.isPrimary"
                icon="mdi-key-variant"
                size="12"
                color="warning"
                title="Primary Key"
              />
              <!-- Иконка для индексируемых полей -->
              <v-icon
                v-else-if="col.isIndexed"
                icon="mdi-flash-outline"
                size="12"
                color="info"
                title="Indexed Field"
              />

              <Body
                variant="xxsMono"
                :color="sortBy === col.key ? 'primary' : 'muted'"
              >
              {{ col.label }}
              </Body>

              <!-- Стрелка сортировки -->
              <v-icon
                v-if="sortBy === col.key"
                :icon="sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="12"
                color="primary"
              />
            </Grid>
          </th>
          <th class="text-right">
            <Body variant="xxsMono" color="muted">ACTIONS</Body>
          </th>
        </tr>
        </thead>

        <tbody>
        <tr v-if="!loading && records.length === 0">
          <td :colspan="columns.length + 1" class="text-center py-6">
            <Body variant="sMedium" color="muted">No records found in "{{ schema.title }}"</Body>
          </td>
        </tr>

        <tr
          v-for="item in records"
          :key="getRowKey(item)"
          :class="{ 'bg-surface-light': selectedId === getRowKey(item) }"
          style="cursor: pointer"
          @click="emit('inspect', item)"
        >
          <td v-for="col in columns" :key="col.key">
            <!-- Слот для кастомного переопределения любой колонки снаружи -->
            <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :col="col">

              <!-- 1. Пустое значение -->
              <Body v-if="item[col.key] === null || item[col.key] === undefined || item[col.key] === ''" variant="xsMono" color="muted">
              —
              </Body>

              <!-- 2. Отображение цвета (для таблицы Colors) -->
              <Grid v-else-if="col.isColor" variant="x_start" gap="xs">
                  <span
                    :style="{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor: item[col.key],
                      border: '1px solid rgba(128,128,128,0.4)'
                    }"
                  />
                <Body variant="xsMono">{{ item[col.key] }}</Body>
              </Grid>

              <!-- 3. Булевы значения (isBinary, isRtl, hasDst) -->
              <Badge
                v-else-if="col.isBoolean"
                :label="item[col.key] ? 'Yes' : 'No'"
                :role="item[col.key] ? 'success' : 'secondary'"
              />

              <!-- 4. Массивы (extensions, countries) -->
              <Grid v-else-if="col.isArray && Array.isArray(item[col.key])" variant="x_start" gap="xss" wrap>
                <Badge
                  v-for="(val, idx) in item[col.key].slice(0, 4)"
                  :key="idx"
                  :label="String(val)"
                  role="info"
                />
                <Badge
                  v-if="item[col.key].length > 4"
                  :label="`+${item[col.key].length - 4}`"
                  role="secondary"
                />
              </Grid>

              <!-- 5. Локализации (i18n JSONB) -->
              <Badge
                v-else-if="col.isI18n && typeof item[col.key] === 'object'"
                :label="`${Object.keys(item[col.key]).length} locales`"
                role="info"
              />

              <!-- 6. Глифы, эмодзи, символы валют/зодиака -->
              <Body v-else-if="col.isGlyph" variant="lgBold">
              {{ item[col.key] }}
              </Body>

              <!-- 7. Ссылки (websiteUrl) -->
              <a
                v-else-if="col.isUrl"
                :href="item[col.key]"
                target="_blank"
                rel="noopener noreferrer"
                class="text-decoration-none"
                @click.stop
              >
                <Grid variant="x_start" gap="xss">
                  <Body variant="xsMono" color="primary" truncate style="max-width: 200px">
                  {{ item[col.key] }}
                  </Body>
                  <v-icon icon="mdi-open-in-new" size="12" color="primary" />
                </Grid>
              </a>

              <!-- 8. Первичный ключ -->
              <Body v-else-if="col.isPrimary" variant="xsMono" color="primary">
              {{ item[col.key] }}
              </Body>

              <!-- 9. Индексируемые поля / Категории -->
              <Badge
                v-else-if="col.key === 'category' || col.key === 'deviceType' || col.key === 'element'"
                :label="String(item[col.key])"
                role="primary"
              />

              <!-- 10. Дефолтный текстовый вывод -->
              <Body
                v-else
                variant="sMedium"
                truncate
                style="max-width: 260px"
                :title="String(item[col.key])"
              >
              {{ item[col.key] }}
              </Body>

            </slot>
          </td>

          <!-- Actions Column -->
          <td @click.stop>
            <Grid variant="x_end" gap="xss">
              <slot name="actions" :item="item">
<!--                <Button-->
<!--                  v-if="allowMr"-->
<!--                  variant="tonal"-->
<!--                  size="xs"-->
<!--                  color="secondary"-->
<!--                  @click="emit('propose-mr', item)"-->
<!--                >-->
<!--                  MR-->
<!--                </Button>-->
<!--                <Button-->
<!--                  variant="text"-->
<!--                  size="xs"-->
<!--                  color="primary"-->
<!--                  @click="emit('inspect', item)"-->
<!--                >-->
<!--                  Inspect-->
<!--                </Button>-->
                <AppCopyBtn
                  :text="getRowKey(item)"
                  :label="primaryKey.toUpperCase()"
                />
              </slot>
            </Grid>
          </td>
        </tr>
        </tbody>
      </v-table>

      <!-- Pagination Footer -->
      <Grid variant="x_between" padding="sm" border="t">
        <Body variant="xsMono" color="muted">
        Showing {{ total === 0 ? 0 : (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }} of {{ total }}
        </Body>
        <Grid variant="x" gap="xs">
          <Button
            variant="tonal"
            size="xs"
            :disabled="page <= 1 || loading"
            @click="emit('page-change', page - 1)"
          >
            Prev
          </Button>
          <Button
            variant="tonal"
            size="xs"
            :disabled="page >= totalPages || loading"
            @click="emit('page-change', page + 1)"
          >
            Next
          </Button>
        </Grid>
      </Grid>
  </Grid>
</template>
