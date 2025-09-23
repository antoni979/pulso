<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useDietStore } from '../../stores/dietStore';

defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const dietStore = useDietStore();

const nuevoCliente = ref({ email: '', password: '', nombre_completo: '' });
const isLoading = ref(false);
const error = ref('');
const exito = ref('');

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = '';
  exito.value = '';
  try {
    const data = await authStore.crearCliente(nuevoCliente.value.email, nuevoCliente.value.password, nuevoCliente.value.nombre_completo);
    exito.value = data.message || 'Cliente creado con éxito.';
    await dietStore.obtenerClientes();
    setTimeout(() => {
      emit('update:modelValue', false);
      nuevoCliente.value = { email: '', password: '', nombre_completo: '' };
    }, 2000);
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6">Crear un nuevo cliente</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Form fields -->
          <input v-model="nuevoCliente.nombre_completo" placeholder="Nombre Completo" required class="w-full p-2 border rounded"/>
          <input v-model="nuevoCliente.email" type="email" placeholder="Email" required class="w-full p-2 border rounded"/>
          <input v-model="nuevoCliente.password" type="password" placeholder="Contraseña Temporal" required class="w-full p-2 border rounded"/>
          
          <div v-if="error" class="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{{ error }}</div>
          <div v-if="exito" class="p-3 bg-green-100 text-green-800 rounded-lg text-sm">{{ exito }}</div>

          <div class="flex justify-end gap-4 pt-4">
            <button type="button" @click="emit('update:modelValue', false)" class="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
            <button type="submit" :disabled="isLoading" class="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">{{ isLoading ? 'Creando...' : 'Crear Cliente' }}</button>
          </div>
        </form>
      </div>
    </div>
</template>