class EventListener {
  constructor() {
    this.listeners = [];
  }
  addListener(l) {
    this.listeners.push(l);
  }
  notify() {
    this.listeners.forEach((l) => l());
  }
};
