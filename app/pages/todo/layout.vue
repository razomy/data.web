<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, h } from 'vue'
import { useIdeLayout } from '~/razomy/tab/useIdeLayout.ts'
import UserInspector from '~/components/UserInspector.vue'
import {Container} from '@razomy/vue'
import {Grid} from '@razomy/vue'
import {Card} from '@razomy/vue'
import {Body} from '@razomy/vue'
import {Button} from '@razomy/vue'

const { definePageTabs, openWithContext } = useIdeLayout()

const selectedUserId = ref<number | null>(null)
const users = ref([
  { id: 1, name: 'Алексей Иванов', role: 'Frontend Lead' },
  { id: 2, name: 'Мария Смирнова', role: 'UI/UX Designer' },
  { id: 3, name: 'Дмитрий Соколов', role: 'DevOps Engineer' },
])

// Декларативная регистрация с авто-очисткой при уходе со страницы
definePageTabs({
  left: [
    {
      id: 'project',
      title: 'Проект',
      icon: 'mdi-folder-outline',
      shortcut: 'Alt+1',
      component: {
        render: () => h(Body, { variant: 'xsMono' }, () => '📁 src/\n  📄 app.vue\n  📄 nuxt.config.ts'),
      },
    },
  ],
  right: [
    {
      id: 'inspector',
      title: 'Инспектор',
      icon: 'mdi-information-slab-circle-outline',
      component: UserInspector,
      props: { user: null },
    },
    {
      id: 'notifications',
      title: 'События',
      icon: 'mdi-bell-outline',
      badge: 2,
      component: {
        render: () => h(Body, { variant: 'sRegular' }, () => 'Все системы работают нормально.'),
      },
    },
  ],
})

const inspectUser = (person: (typeof users.value)[0]) => {
  selectedUserId.value = person.id
  openWithContext('right', 'inspector', { user: person })
}
</script>

<template>
  <Container gap="md" padding="md">
    <Grid variant="y" gap="xs">
      <Body as="h1" variant="xlBold">Список сотрудников</Body>
      <Body variant="sRegular" color="muted">
      Кликните на карточку — справа откроется «Инспектор» с контекстом (нажмите Esc, чтобы закрыть).
      </Body>
    </Grid>

    <Grid variant="x_three" gap="md">
      <Card
        v-for="person in users"
        :key="person.id"
        padding="md"
        gap="xs"
        interactive
        :class="{ 'border-primary': selectedUserId === person.id }"
        @click="inspectUser(person)"
      >
        <Body variant="mBold">{{ person.name }}</Body>
        <Body variant="xsRegular" color="muted">{{ person.role }}</Body>
        <Button size="xs" color="primary" variant="tonal" prepend-icon="mdi-magnify">
          Инспектировать
        </Button>
      </Card>
    </Grid>
  </Container>
</template>
