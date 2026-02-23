import type { PatternFactory } from "./pattern.js";

type PatternFactoryConstructor = new (...args: any[]) => PatternFactory;

class PatternFactoryRegistry {
  private static factories: Map<string, PatternFactoryConstructor> = new Map();

  static register(name: string, factory: PatternFactoryConstructor) {
    PatternFactoryRegistry.factories.set(name, factory);
  }

  static getFactory(name: string): PatternFactoryConstructor | undefined {
    return PatternFactoryRegistry.factories.get(name);
  }

  static getAllFactories(): PatternFactoryConstructor[] {
    return Array.from(PatternFactoryRegistry.factories.values());
  }
}

export { PatternFactoryRegistry };
