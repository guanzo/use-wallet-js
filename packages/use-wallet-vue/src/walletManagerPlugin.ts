import { WalletManager, type WalletManagerConfig, defaultState } from '@txnlab/use-wallet-js'
import { ref, readonly } from 'vue'

export const WalletManagerPlugin = {
  install(app: any, options: WalletManagerConfig) {
    const manager = new WalletManager(options)
    let state = ref({ ...defaultState })

    manager.subscribe((newState) => {
      state.value = { ...newState }
    })

    app.provide('walletManager', manager)
    app.provide('walletState', readonly(state))
  }
}
