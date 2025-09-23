<script setup>
import DietMealCard from './DietMealCard.vue';

const props = defineProps({
  dayName: { type: String, required: true },
  dayData: { type: Object, required: true },
});
const emit = defineEmits(['add-item', 'edit-item', 'delete-item']);

// Función explícita para manejar el clic y construir el contexto
function onAddItemClick(mealName) {
  const context = { day: props.dayName, meal: mealName };
  emit('add-item', context);
}
</script>

<template>
  <div class="bg-white rounded-xl shadow p-4 space-y-4">
    <h3 class="font-bold capitalize text-center text-lg text-gray-800">{{ dayName }}</h3>
    
    <DietMealCard
      v-for="(items, mealName) in dayData"
      :key="mealName"
      :meal-name="mealName"
      :meal-items="items"
      @add-item="onAddItemClick(mealName)"
      @edit-item="itemToEdit => emit('edit-item', itemToEdit)"
      @delete-item="itemToDelete => emit('delete-item', itemToDelete)"
    />
  </div>
</template>