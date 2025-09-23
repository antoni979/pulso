<script setup>
import { ref, watch } from 'vue';
import { useDietStore } from '../../stores/dietStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemToEdit: { type: Object, default: null },
  context: { type: Object, required: true },
});
const emit = defineEmits(['update:modelValue', 'save']);

const dietStore = useDietStore();
const formData = ref({ alimento_id: null, cantidad: 100 });
const error = ref('');

const isEditMode = ref(false);
const modalTitle = ref('');
const buttonText = ref('');
const subTitle = ref('');

// Función para capitalizar la primera letra
const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

// Watch para reaccionar cuando el modal se abre y configurar TODO.
watch(() => props.modelValue, (isOpening) => {
  if (isOpening) {
    error.value = '';
    isEditMode.value = !!props.itemToEdit;

    if (isEditMode.value) {
      // Configuración para modo EDICIÓN
      modalTitle.value = 'Editar Alimento';
      buttonText.value = 'Guardar Cambios';
      subTitle.value = `Editando en ${capitalize(props.itemToEdit.comida)} de ${capitalize(props.itemToEdit.dia)}`;
      formData.value.alimento_id = props.itemToEdit.alimento.id;
      formData.value.cantidad = props.itemToEdit.cantidad;
    } else {
      // Configuración para modo AÑADIR
      modalTitle.value = 'Añadir Alimento';
      buttonText.value = 'Añadir Alimento';
      if (props.context && props.context.dia && props.context.comida) {
        subTitle.value = `A ${capitalize(props.context.comida)} de ${capitalize(props.context.dia)}`;
      } else {
        subTitle.value = 'Contexto no definido';
      }
      formData.value = { alimento_id: null, cantidad: 100 };
    }
  }
});

const handleSubmit = () => {
  if (!formData.value.alimento_id) {
    error.value = "Por favor, selecciona un alimento.";
    return;
  }
  
  const payload = { ...formData.value };

  if (isEditMode.value) {
    payload.id = props.itemToEdit.id;
  } else {
    if (!props.context || !props.context.dia || !props.context.comida) {
      error.value = "Error Interno: El contexto se ha perdido. Cierra el modal y vuelve a intentarlo.";
      return;
    }
    payload.dia = props.context.dia;
    payload.comida = props.context.comida;
  }
  emit('save', payload);
};
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-1 capitalize">{{ modalTitle }}</h2>
      <p class="text-gray-600 mb-6">{{ subTitle }}</p>
      
      <form @submit.prevent="handleSubmit" class="space-y-4 pt-4">
        <div>
          <label for="alimento-select" class="block text-sm font-medium text-gray-700">Alimento</label>
          <select v-model="formData.alimento_id" id="alimento-select" :disabled="isEditMode" required class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed">
            <option :value="null" disabled>Selecciona un alimento...</option>
            <option v-for="alimento in dietStore.alimentos" :key="alimento.id" :value="alimento.id">{{ alimento.nombre }}</option>
          </select>
        </div>
        <div>
          <label for="cantidad" class="block text-sm font-medium text-gray-700">Cantidad</label>
          <div class="relative mt-1">
              <input v-model.number="formData.cantidad" type="number" id="cantidad" required class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              <span class="absolute inset-y-0 right-4 flex items-center text-gray-500 text-sm">{{ formData.alimento_id ? dietStore.alimentos.find(a => a.id === formData.alimento_id)?.unidad_porcion : 'g/u' }}</span>
          </div>
        </div>
        <div v-if="error" class="p-3 bg-red-100 text-red-800 rounded-lg text-sm text-center">{{ error }}</div>
        <div class="flex justify-end gap-4 pt-4">
          <button type="button" @click="emit('update:modelValue', false)" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button type="submit" class="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">{{ buttonText }}</button>
        </div>
      </form> <!-- ¡ESTA ES LA ETIQUETA QUE FALTABA! -->
    </div>
  </div>
</template>