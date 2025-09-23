<script setup>
import DietDayColumn from './DietDayColumn.vue';
defineProps({
  diet: { type: Object, required: true }
});
const emit = defineEmits(['add-item', 'edit-item', 'delete-item']);
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
    <DietDayColumn
      v-for="(meals, dayName) in diet.dias"
      :key="dayName"
      :day-name="dayName"
      :day-data="meals"
      @add-item="context => emit('add-item', context)"
      @edit-item="item => emit('edit-item', item)"
      @delete-item="item => emit('delete-item', item)"
    />
  </div>
</template>