<template>
  <div class="wallet-display">
    <div class="wallet-display-content">
      <img
        v-if="factionLogo"
        :src="factionLogo"
        :alt="faction || ''"
        class="wallet-display-logo"
      />
      <span :class="factionClass">
        {{ displayName }}
      </span>
      <BaseCopyButton
        v-if="showCopyButton"
        :text-to-copy="wallet"
        size="small"
        :tooltip="copyTooltip"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletDisplay } from '../composables/useWalletDisplay'
import BaseCopyButton from './BaseCopyButton.vue'

interface Props {
  wallet: string
  showCopyButton?: boolean
  copyTooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  showCopyButton: true,
  copyTooltip: 'Copy wallet address'
})

const { getWalletDisplayName, getFaction, getFactionClass, getFactionLogo } = useWalletDisplay()

const displayName = computed(() => getWalletDisplayName(props.wallet))
const faction = computed(() => getFaction(props.wallet))
const factionClass = computed(() => getFactionClass(props.wallet))
const factionLogo = computed(() => getFactionLogo(props.wallet))
</script>

<style scoped>
.wallet-display {
  display: inline-block;
}

.wallet-display-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.wallet-display-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.faction-mud {
  color: var(--color-faction-mud-bright);
  font-weight: 700;
}

.faction-ustur {
  color: var(--color-faction-ustur-bright);
  font-weight: 700;
}

.faction-oni {
  color: var(--color-faction-oni-bright);
  font-weight: 700;
}
</style>

