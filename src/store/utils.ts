import { isValidNetworkId } from 'src/network'
import { WalletId, type WalletAccount } from 'src/wallets'
import type { State, WalletState } from './types'

// Type guards

export function isValidWalletId(walletId: any): walletId is WalletId {
  return Object.values(WalletId).includes(walletId)
}

export function isValidWalletAccount(account: any): account is WalletAccount {
  return (
    typeof account === 'object' &&
    account !== null &&
    typeof account.name === 'string' &&
    typeof account.address === 'string'
  )
}

export function isValidWalletState(wallet: any): wallet is WalletState {
  return (
    typeof wallet === 'object' &&
    wallet !== null &&
    Array.isArray(wallet.accounts) &&
    wallet.accounts.every(isValidWalletAccount) &&
    (wallet.activeAccount === null || isValidWalletAccount(wallet.activeAccount))
  )
}

export function isValidState(state: any): state is State {
  if (!state || typeof state !== 'object') return false
  if (!(state.wallets instanceof Map)) return false
  for (const [walletId, wallet] of state.wallets.entries()) {
    if (!isValidWalletId(walletId) || !isValidWalletState(wallet)) return false
  }
  if (state.activeWallet !== null && !isValidWalletId(state.activeWallet)) return false
  if (!isValidNetworkId(state.activeNetwork)) return false

  return true
}

// Serialize/deserialize persisted state (handle Map type)

// JSON.stringify(state, replacer)
export function replacer(key: string, value: any): any {
  if (value instanceof Map) {
    return { _type: 'Map', data: Array.from(value.entries()) }
  }
  return value
}

// JSON.parse(state, reviver)
export function reviver(key: string, value: any): any {
  if (typeof value === 'object' && value !== null && value._type === 'Map') {
    return new Map(value.data)
  }
  return value
}
