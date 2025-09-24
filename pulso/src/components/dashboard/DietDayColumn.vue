<script setup>
import DietMealCard from './DietMealCard.vue';

const props = defineProps({
  dayName: { type: String, required: true },
  dayData: { type: Object, required: true },
});
const emit = defineEmits(['add-item', 'edit-item', 'delete-item']);

// Función explícita para manejar el clic y construir el contexto
function onAddItemClick(comida) {
  const context = { dia: props.dayName, comida: comida };
  emit('add-item', context);
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6 space-y-6 transition-all duration-300 hover:shadow-lg hover:bg-gray-50">
    <h3 class="font-bold capitalize text-center text-lg text-gray-800 transition-colors duration-200 hover:text-emerald-700">{{ dayName }}</h3>

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