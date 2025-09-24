<script setup>
import { ref, watch, computed } from 'vue';
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
const buttonText = computed(() => isEditMode.value ? 'Guardar Cambios' : 'Añadir Alimento');
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
      subTitle.value = `Editando en ${capitalize(props.itemToEdit.comida)} de ${capitalize(props.itemToEdit.dia)}`;
      formData.value.alimento_id = props.itemToEdit.alimento.id;
      formData.value.cantidad = props.itemToEdit.cantidad;
    } else {
      // Configuración para modo AÑADIR
      modalTitle.value = 'Añadir Alimento';
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
  <transition name="modal" appear>
    <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-2xl p-10 w-full max-w-lg border border-emerald-200">
       <div class="flex items-center gap-3 mb-2">
         <svg class="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
           <path d="M12 2C13.1 2 14 2.9 14 4V6H16C17.1 6 18 6.9 18 8V16C18 17.1 17.1 18 16 18H8C6.9 18 6 17.1 6 16V8C6 6.9 6.9 6 8 6H10V4C10 2.9 10.9 2 12 2ZM12 4V6H14V4H12ZM8 8V16H16V8H8Z"/>
         </svg>
         <h2 class="text-2xl font-bold capitalize">{{ modalTitle }}</h2>
       </div>
       <p class="text-gray-600 mb-8">{{ subTitle }}</p>

       <form @submit.prevent="handleSubmit" class="space-y-6 pt-6">
        <div>
          <label for="alimento-select" class="block text-sm font-semibold text-gray-700">Alimento</label>
          <select v-model="formData.alimento_id" id="alimento-select" :disabled="isEditMode" required class="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 hover:shadow-lg transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed">
            <option :value="null" disabled>Selecciona un alimento...</option>
            <option v-for="alimento in dietStore.alimentos" :key="alimento.id" :value="alimento.id">{{ alimento.nombre }}</option>
          </select>
        </div>
        <div>
          <label for="cantidad" class="block text-sm font-semibold text-gray-700">Cantidad</label>
          <div class="relative mt-1">
              <input v-model.number="formData.cantidad" type="number" id="cantidad" required class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 hover:shadow-lg transition-all duration-200"/>
              <span class="absolute inset-y-0 right-4 flex items-center text-gray-500 text-sm font-medium">{{ formData.alimento_id ? dietStore.alimentos.find(a => a.id === formData.alimento_id)?.unidad_porcion : 'g/u' }}</span>
          </div>
        </div>
        <div v-if="error" class="p-3 bg-red-100 text-red-800 rounded-lg text-sm text-center animate-pulse">{{ error }}</div>
        <div class="flex justify-end gap-6 pt-6">
          <button type="button" @click="emit('update:modelValue', false)" class="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-400 shadow-md transition-all duration-300 hover:shadow-lg">Cancelar</button>
          <button type="submit" class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-800 shadow-md transition-all duration-300 hover:shadow-lg">{{ buttonText }}</button>
        </div>
      </form> <!-- ¡ESTA ES LA ETIQUETA QUE FALTABA! -->
    </div>
  </div>
 </transition>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
 transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.modal-enter-from {
 opacity: 0;
 transform: scale(0.8) translateY(-20px);
}
.modal-leave-to {
 opacity: 0;
 transform: scale(0.9) translateY(10px);
}
</style>