import { LOCAL_STORAGE_KEY } from 'src/constants'
import { PubSub } from 'src/lib/pubsub'
import { Actions, Mutations, Status, StoreActions, StoreMutations } from 'src/types/state'
import { isValidState, replacer, reviver } from 'src/utils/state'

export class Store<StateType extends object> {
  private actions: Actions<StateType>
  private mutations: Mutations<StateType>
  private state: StateType
  private status: Status
  private events: PubSub

  constructor(params: {
    actions: Actions<StateType>
    mutations: Mutations<StateType>
    state: StateType
  }) {
    this.actions = params.actions
    this.mutations = params.mutations
    this.status = Status.IDLE
    this.events = new PubSub()

    const initialState = this.loadPersistedState() || params.state
    this.state = this.createProxy(initialState)
  }

  private createProxy<T extends object>(state: T): T {
    return new Proxy(state, {
      set: (target, key, value) => {
        console.log('Proxy set callback', { target, key, value })
        if (key in target) {
          target[key as keyof T] = value
          console.log(`stateChange: ${String(key)}: ${String(value)}`)
          this.events.publish('stateChange', this.state)
          if (this.status !== Status.MUTATION) {
            console.warn(`You should use a mutation to set ${String(key)}`)
          }
          this.status = Status.IDLE
          return true
        } else {
          console.warn(`Property ${String(key)} does not exist on state object.`)
          return false
        }
      }
    })
  }

  public dispatch(actionKey: StoreActions, payload: any): boolean {
    if (typeof this.actions[actionKey] !== 'function') {
      console.error(`Action "${actionKey}" doesn't exist.`)
      return false
    }

    console.groupCollapsed(`ACTION: ${actionKey}`)

    this.status = Status.ACTION
    this.actions[actionKey](this, payload)

    console.groupEnd()

    return true
  }

  public commit(mutationKey: StoreMutations, payload: any): boolean {
    if (typeof this.mutations[mutationKey] !== 'function') {
      console.log(`Mutation "${mutationKey}" doesn't exist`)
      return false
    }
    console.log(`MUTATION: ${mutationKey}`, payload)

    this.status = Status.MUTATION

    const newState = this.mutations[mutationKey](this.state, payload)

    this.state = this.createProxy(newState)
    this.savePersistedState()

    return true
  }

  public getState(): StateType {
    return this.state
  }

  public loadPersistedState(): StateType | null {
    try {
      const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (serializedState === null) {
        return null
      }
      const parsedState = JSON.parse(serializedState, reviver)
      if (!isValidState(parsedState)) {
        console.error('Parsed state:', parsedState)
        throw new Error('Persisted state is invalid')
      }
      return parsedState as StateType
    } catch (error) {
      console.error('Could not load state from local storage:', error)
      return null
    }
  }

  public savePersistedState(): void {
    try {
      const state = this.getState()
      const serializedState = JSON.stringify(state, replacer)
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState)
    } catch (error) {
      console.error('Could not save state to local storage:', error)
    }
  }
}