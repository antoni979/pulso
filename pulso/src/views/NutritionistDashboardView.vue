<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDietStore } from '../stores/dietStore';
import { useAuthStore } from '../stores/authStore';
import DietGrid from '../components/dashboard/DietGrid.vue';
import CreateClientModal from '../components/dashboard/CreateClientModal.vue';
import AddOrEditFoodModal from '../components/dashboard/AddOrEditFoodModal.vue';

const dietStore = useDietStore();
const authStore = useAuthStore();

const clienteSeleccionado = ref(null);
const fechaSeleccionada = ref(new Date().toISOString().slice(0, 10));
const mostrandoModalCliente = ref(false);
const mostrandoModalAlimento = ref(false);
const itemParaEditar = ref(null);
const contextoParaAñadir = ref({ dia: '', comida: '' });

const modalContext = computed(() => {
  if (itemParaEditar.value) {
    return { dia: itemParaEditar.value.dia, comida: itemParaEditar.value.comida };
  }
  return contextoParaAñadir.value;
});

onMounted(() => {
  dietStore.obtenerClientes();
  dietStore.obtenerAlimentos();
});

const manejarCambioCliente = () => {
  if (clienteSeleccionado.value) {
    dietStore.obtenerDietaParaCliente(clienteSeleccionado.value, fechaSeleccionada.value);
  }
};

const handleAddItem = (context) => {
  itemParaEditar.value = null;
  contextoParaAñadir.value = context;
  mostrandoModalAlimento.value = true;
};

const handleEditItem = (item) => {
  itemParaEditar.value = item;
  mostrandoModalAlimento.value = true;
};

const handleDeleteItem = (item) => {
  if (confirm(`¿Estás seguro de que quieres eliminar "${item.alimento.nombre}"?`)) {
    dietStore.eliminarElementoDieta(item);
  }
};

const handleSaveFood = async (payload) => {
  try {
    if (payload.id) {
      await dietStore.actualizarElementoDieta(payload.id, payload.cantidad);
    } else {
      await dietStore.agregarElementoDieta(payload);
    }
    mostrandoModalAlimento.value = false;
  } catch (error) {
    console.error("Error al guardar el alimento:", error);
  }
};
</script>

<template>
  <div class="p-4 sm:p-8">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Panel de Nutricionista</h1>
        <p class="text-gray-600">Planifica las dietas y gestiona tus clientes.</p>
      </div>
      <div class="flex items-center gap-4">
        <button @click="mostrandoModalCliente = true" class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm">
          + Crear Nuevo Cliente
        </button>
        <button @click="authStore.signOut()" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Cerrar Sesión</button>
      </div>
    </header>

    <div class="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
      <div class="flex-1">
        <label for="client-select" class="block text-sm font-medium text-gray-700">Seleccionar Cliente</label>
        <select id="client-select" v-model="clienteSeleccionado" @change="manejarCambioCliente" class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500">
          <option :value="null" disabled>Elige un cliente...</option>
          <option v-for="cliente in dietStore.clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombre_completo }}</option>
        </select>
      </div>
      <div class="flex-1">
        <label for="date-select" class="block text-sm font-medium text-gray-700">Semana del</label>
        <input type="date" id="date-select" v-model="fechaSeleccionada" @change="manejarCambioCliente" class="mt-1 block w-full pl-3 pr-4 py-2 rounded-md border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
      </div>
    </div>

    <div v-if="dietStore.cargando" class="text-center p-10 text-gray-500">Cargando...</div>
    <DietGrid
      v-else-if="dietStore.dietaActual"
      :diet="dietStore.dietaActual"
      @add-item="handleAddItem"
      @edit-item="handleEditItem"
      @delete-item="handleDeleteItem"
    />

    <CreateClientModal v-model="mostrandoModalCliente" />
    <AddOrEditFoodModal 
      v-if="mostrandoModalAlimento"
      v-model="mostrandoModalAlimento"
      :item-to-edit="itemParaEditar"
      :context="modalContext" 
      @save="handleSaveFood"
    />
  </div>
</template>