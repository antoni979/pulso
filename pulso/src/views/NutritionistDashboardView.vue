<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useDietStore } from '../stores/dietStore';
import { useAuthStore } from '../stores/authStore';
import DietGrid from '../components/dashboard/DietGrid.vue';
import CreateClientModal from '../components/dashboard/CreateClientModal.vue';
import AddOrEditFoodModal from '../components/dashboard/AddOrEditFoodModal.vue';
import WeekSelector from '../components/dashboard/WeekSelector.vue';

const dietStore = useDietStore();
const authStore = useAuthStore();

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};

const clienteSeleccionado = ref(null);
const fechaSeleccionada = ref(getMonday(new Date()));
const mostrandoModalCliente = ref(false);
const mostrandoModalAlimento = ref(false);
const mostrandoModalSemana = ref(false);
const itemParaEditar = ref(null);
const contextoParaAñadir = ref({ dia: '', comida: '' });

const modalContext = computed(() => {
  if (itemParaEditar.value) {
    return { dia: itemParaEditar.value.dia, comida: itemParaEditar.value.comida };
  }
  return contextoParaAñadir.value;
});

const semanaSeleccionadaFormateada = computed(() => {
  if (!fechaSeleccionada.value) return 'Seleccionar Semana';
  const monday = new Date(fechaSeleccionada.value);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const options = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('es-ES', options)} - ${sunday.toLocaleDateString('es-ES', options)}`;
});

onMounted(() => {
  dietStore.obtenerClientes();
  dietStore.obtenerAlimentos();
});

watch(fechaSeleccionada, () => {
  if (clienteSeleccionado.value) {
    dietStore.obtenerDietaParaCliente(clienteSeleccionado.value, fechaSeleccionada.value);
  }
  // Close modal and reset context when week changes
  mostrandoModalAlimento.value = false;
  itemParaEditar.value = null;
  contextoParaAñadir.value = { dia: '', comida: '' };
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

    <div class="flex flex-col sm:flex-row gap-4 mb-8 p-3 bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg hover:bg-gray-50">
      <div class="flex-1">
        <label for="client-select" class="block text-sm font-medium text-gray-700">Seleccionar Cliente</label>
        <select id="client-select" v-model="clienteSeleccionado" @change="manejarCambioCliente" class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:bg-emerald-50">
          <option :value="null" disabled>Elige un cliente...</option>
          <option v-for="cliente in dietStore.clientes" :key="cliente.id" :value="cliente.id">{{ cliente.nombre_completo }}</option>
        </select>
      </div>
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700">Seleccionar Semana</label>
        <button @click="mostrandoModalSemana = true" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:bg-emerald-50 flex items-center justify-between">
          <span>{{ semanaSeleccionadaFormateada }}</span>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </button>
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
    <WeekSelector
      v-model="fechaSeleccionada"
      :show-modal="mostrandoModalSemana"
      @update:show-modal="mostrandoModalSemana = $event"
    />
  </div>
</template>