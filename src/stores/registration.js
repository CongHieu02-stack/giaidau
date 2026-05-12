import { defineStore } from 'pinia';

export const useRegistrationStore = defineStore('registration', {
  state: () => ({
    selectedPlayerIds: [],
    maxPlayers: 0,
    loading: false,
    error: null
  }),

  getters: {
    selectedCount: (state) => state.selectedPlayerIds.length,
    isLimitReached: (state) => state.selectedPlayerIds.length >= state.maxPlayers,
    isReadyToSubmit: (state) => state.selectedPlayerIds.length === state.maxPlayers,
    isSelected: (state) => (playerId) => state.selectedPlayerIds.includes(playerId)
  },

  actions: {
    setMaxPlayers(count) {
      this.maxPlayers = count;
    },

    togglePlayer(playerId) {
      const index = this.selectedPlayerIds.indexOf(playerId);
      if (index > -1) {
        this.selectedPlayerIds.splice(index, 1);
      } else {
        if (this.selectedCount < this.maxPlayers) {
          this.selectedPlayerIds.push(playerId);
        }
      }
    },

    reset() {
      this.selectedPlayerIds = [];
      this.maxPlayers = 0;
      this.error = null;
    }
  }
});
