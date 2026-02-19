/**
 * A simple implementation of the Observer pattern.
 * Restricts listeners to functions that take no arguments and return nothing.
 */
export class EventListener {
  // Define the type of the array: an array of functions
  private listeners: (() => void)[];

  constructor() {
    this.listeners = [];
  }

  /**
   * Adds a callback function to the listener list.
   * @param l A function to be executed on notify.
   */
  addListener(l: () => void): void {
    this.listeners.push(l);
  }

  /**
   * Executes all registered listener functions.
   */
  notify(): void {
    this.listeners.forEach((l) => l());
  }
}
