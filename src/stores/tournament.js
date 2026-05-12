/**
 * Tournament Store (Pinia)
 * SRP: Centralized state management for tournaments
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tournamentService } from '../services/TournamentService.js';

export const useTournamentStore = defineStore('tournament', () => {
  // State
  const tournaments = ref([]);
  const currentTournament = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const perPage = ref(10);
  const draftGroups = ref([]);

  // Getters
  const upcomingTournaments = computed(() => 
    tournaments.value.filter(t => t.status === 'upcoming' || t.status === 'registration_open')
  );
  
  const ongoingTournaments = computed(() => 
    tournaments.value.filter(t => t.status === 'ongoing')
  );
  
  const completedTournaments = computed(() => 
    tournaments.value.filter(t => t.status === 'completed')
  );

  const totalPages = computed(() => Math.ceil(totalCount.value / perPage.value));

  // Actions
  async function fetchTournaments(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.getTournaments({
        ...filters,
        page: currentPage.value,
        perPage: perPage.value
      });

      if (result.isOk()) {
        const data = result.getValue();
        tournaments.value = data.data;
        totalCount.value = data.total;
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function fetchTournament(id) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.getTournament(id);

      if (result.isOk()) {
        currentTournament.value = result.getValue();
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function createTournament(tournamentData, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.createTournament(tournamentData, userId);

      if (result.isOk()) {
        tournaments.value.unshift(result.getValue());
        return { success: true, data: result.getValue() };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function updateTournament(id, updateData, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.updateTournament(id, updateData, userId);

      if (result.isOk()) {
        const updatedTournament = result.getValue();
        const index = tournaments.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tournaments.value[index] = updatedTournament;
        }
        if (currentTournament.value?.id === id) {
          currentTournament.value = updatedTournament;
        }
        return { success: true, data: updatedTournament };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function cancelTournament(id, reason, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.cancelTournament(id, reason, userId);

      if (result.isOk()) {
        const cancelledTournament = result.getValue();
        const index = tournaments.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tournaments.value[index] = cancelledTournament;
        }
        if (currentTournament.value?.id === id) {
          currentTournament.value = cancelledTournament;
        }
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function registerClub(tournamentId, clubId, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.registerClub(tournamentId, clubId, userId);

      if (result.isOk()) {
        // Refresh tournament data
        await fetchTournament(tournamentId);
        return { success: true, data: result.getValue() };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function approveRegistration(tournamentId, registrationId, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.approveRegistration(tournamentId, registrationId, userId);

      if (result.isOk()) {
        await fetchTournament(tournamentId);
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function rejectRegistration(tournamentId, registrationId, reason, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.rejectRegistration(tournamentId, registrationId, reason, userId);

      if (result.isOk()) {
        await fetchTournament(tournamentId);
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function generateSchedule(tournamentId, venueIds, userId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await tournamentService.generateSchedule(tournamentId, venueIds, userId);

      if (result.isOk()) {
        await fetchTournament(tournamentId);
        return { success: true, data: result.getValue() };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  function setPage(page) {
    currentPage.value = page;
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentTournament() {
    currentTournament.value = null;
  }

  function setDraftGroups(groups) {
    draftGroups.value = groups;
  }

  function updateDraftGroups(groups) {
    draftGroups.value = groups;
  }

  function clearDraftGroups() {
    draftGroups.value = [];
  }

  return {
    // State
    tournaments,
    currentTournament,
    loading,
    error,
    totalCount,
    currentPage,
    perPage,
    draftGroups,
    
    // Getters
    upcomingTournaments,
    ongoingTournaments,
    completedTournaments,
    totalPages,
    
    // Actions
    fetchTournaments,
    fetchTournament,
    createTournament,
    updateTournament,
    cancelTournament,
    registerClub,
    approveRegistration,
    rejectRegistration,
    generateSchedule,
    setPage,
    clearError,
    clearCurrentTournament,
    setDraftGroups,
    updateDraftGroups,
    clearDraftGroups
  };
});
