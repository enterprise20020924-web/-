<template>
  <div class="shittim-panel-host">
    <ShittimContactDirectory
      v-show="selectedContact === null"
      :present-contacts="presentContacts"
      :contact-factions="contactFactions"
      @close="emit('close')"
      @select="emit('select', $event)"
    />
    <ShittimOpponentDossier
      v-if="selectedContact !== null"
      :contact="selectedContact"
      :battle-pending="battlePending"
      :battle-notice="battleNotice"
      @close="emit('close')"
      @back="emit('back')"
      @start="emit('start')"
    />
  </div>
</template>

<script setup lang="ts">
import ShittimContactDirectory from './ShittimContactDirectory.vue';
import ShittimOpponentDossier from './ShittimOpponentDossier.vue';
import type { ContactFaction, RelationshipContact } from '../mobile/relationship-runtime';
withDefaults(
  defineProps<{
    presentContacts: RelationshipContact[];
    contactFactions: ContactFaction[];
    selectedContact: RelationshipContact | null;
    battlePending?: boolean;
    battleNotice?: string | null;
  }>(),
  { battlePending: false, battleNotice: null },
);
const emit = defineEmits<{ close: []; back: []; select: [contact: RelationshipContact]; start: [] }>();
</script>

<style scoped>
.shittim-panel-host {
  container: shittim-panel / inline-size;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
