import { Data } from "types"

/* ------------------ Command Class ----------------- */

export type CommandFn<T> = (data: T, initial?: boolean) => void

/**
 * A command makes changes to some applicate state. Every command has an "undo"
 * method to reverse its changes. The apps history is a series of commands.
 */
export class BaseCommand<T extends any> {
  timestamp = Date.now()
  name: string
  category: string
  private undoFn: CommandFn<T>
  private doFn: CommandFn<T>
  protected restoreBeforeSelectionState: (data: T) => void
  protected restoreAfterSelectionState: (data: T) => void
  protected saveSelectionState: (data: T) => (data: T) => void
  protected manualSelection: boolean

  constructor(options: {
    do: CommandFn<T>
    undo: CommandFn<T>
    name: string
    category: string
    manualSelection?: boolean
  }) {
    this.name = options.name
    this.category = options.category
    this.doFn = options.do
    this.undoFn = options.undo
    this.manualSelection = options.manualSelection || false
    this.restoreBeforeSelectionState = () => () => {
      null
    }
    this.restoreAfterSelectionState = () => () => {
      null
    }
  }

  undo = (data: T) => {
    if (this.manualSelection) {
      this.undoFn(data)
      return
    }

    // We need to set the selection state to what it was before we after we did the command
    this.restoreAfterSelectionState(data)
    this.undoFn(data)
    this.restoreBeforeSelectionState(data)
  }

  redo = (data: T, initial = false) => {
    if (initial) {
      this.restoreBeforeSelectionState = this.saveSelectionState(data)
    } else {
      this.restoreBeforeSelectionState(data)
    }

    // We need to set the selection state to what it was before we did the command
    this.doFn(data, initial)

    if (initial) {
      this.restoreAfterSelectionState = this.saveSelectionState(data)
    }
  }
}

/* ---------------- Project Specific ---------------- */

/**
 * A subclass of BaseCommand that sends events to our state. In our case, we want our actions
 * to mutate the state's data. Actions do not effect the "active states" in
 * the app.
 */
export default class Command extends BaseCommand<Data> {
  saveSelectionState = (data: Data) => {
    const selectedIds = new Set(data.selectedIds)
    return (data: Data) => {
      data.selectedIds = selectedIds
    }
  }
}