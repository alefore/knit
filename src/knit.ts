import { cssDisplayValues, cssProps, htmlInputTypes, htmlProps, htmlTags, urlParams } from './constants.js';
import { drawInputs, parseHash, PatternFactoryInput } from './inputs.js';
import { EventListener } from './listener.js';
import { SwipeHandler } from './swipe.js';
import { Pattern, type PatternFactory } from './pattern.js';
import { PatternFactoryRegistry } from './pattern_factory_registry.js';

// Import pattern factories to ensure they are registered.
import './cable_pattern_factory.js';
import './capelet_pattern_factory.js';
import './cylinder_pattern_factory.js';
import './scarf_pattern_factory.js';

const objectIds = {
  configureButton: 'configureButton',
  factoryWarnings: 'factoryWarnings',
  knitButton: 'knitButton',
  buttonNext: 'buttonNext',
  buttonPrev: 'buttonPrev',
} as const;

class ControlButton {
  private text: string;
  private description: string;
  private htmlObject: HTMLInputElement;

  constructor(id: string | null, text: string, description: string, action: (e: MouseEvent) => void) {
    this.text = text;
    this.description = description;
    const button = document.createElement(htmlTags.input.slice(1, -1)) as HTMLInputElement;
    button.type = htmlInputTypes.submit;
    button.value = this.text;
    button.title = this.description;
    if (id) {
      button.id = id;
    }
    button.addEventListener('click', action);
    this.htmlObject = button;
  }

  appendHtml(container: HTMLElement): this {
    container.appendChild(this.htmlObject);
    return this;
  }

  setEnabled(stateListener: EventListener, value: () => boolean): void {
    const htmlObject = this.htmlObject;
    stateListener.addListener(() => {
      htmlObject.disabled = !value();
    });
  }
}

class KnitState {
  private inputs: URLSearchParams;
  private patternFactories: PatternFactory[];
  private patternFactorySelector: PatternFactoryInput;
  private patternFactoryInputs: PatternFactoryInput[];

  public currentRow: number;
  public configuringStateChange: EventListener;
  public stateChange: EventListener;
  public buttonsForm: HTMLFormElement;
  public configuring: boolean;
  public pattern: Pattern | null = null;

  constructor() {
    this.inputs = parseHash();
    this.patternFactories = PatternFactoryRegistry.getAllFactories().map(Factory => new Factory());

    const factoryNames = Array.from(new Set(this.patternFactories.map(
      instance => instance.factoryName)));

    const firstFactoryName = this.patternFactories[0]!.factoryName;

    this.patternFactorySelector = new PatternFactoryInput(
      'Pattern', 'Pattern', firstFactoryName,
      null, factoryNames);

    this.patternFactoryInputs = [this.patternFactorySelector];

    this.patternFactories.forEach((factory) => {
      const newInputs = factory.getInputs();
      newInputs.forEach((input) =>
        input.addVisibilityRequirement(() =>
          this.patternFactorySelector.value() === factory.factoryName
        )
      );
      this.patternFactoryInputs.push(...newInputs);
    });

    this.patternFactorySelector.listener.addListener(() => {
      this.patternFactoryInputs.forEach((input) => input.adjustVisibility());
    });

    this.patternFactoryInputs.forEach((input) =>
      input.listener.addListener(() => this.configurationInputChanged())
    );

    this.currentRow = Number(this.inputs.get(urlParams.row) ?? 0);
    this.configuringStateChange = new EventListener();
    this.stateChange = new EventListener();
    this.buttonsForm = document.createElement(htmlTags.form.slice(1, -1)) as HTMLFormElement;
    this.buttonsForm.addEventListener('submit', (event) => { event.preventDefault(); });
    this.configuring = this.currentRow === 0;

    this.configuringStateChange.addListener(() => {
      document.getElementById('inputs')!.style.display =
        this.configuring ? cssDisplayValues.inline : cssDisplayValues.none;
      document.getElementById('patternContainer')!.style.display =
        this.configuring ? cssDisplayValues.none : cssDisplayValues.inline;
    });

    this.setupUI();

    drawInputs(this.patternFactoryInputs, this.inputs);
    this.patternFactorySelector.listener.notify();
    this.configuringStateChange.notify();
    this.configurationInputChanged();
    this.stateChange.notify();
    this.renderPattern();
    this.selectRow(this.currentRow);
  }

  private setupUI(): void {
    new ControlButton(null, '📖', 'About this software', () => {
      window.open('http://github.com/alefore/knit', '_blank');
    }).appendHtml(this.buttonsForm);

    new ControlButton(
      objectIds.configureButton, '⚙️', 'Configure the pattern',
      () => {
        if (this.configuring) return;
        this.configuring = true;
        this.configuringStateChange.notify();
      })
      .appendHtml(this.buttonsForm)
      .setEnabled(this.configuringStateChange, () => !this.configuring);

    new ControlButton(
      objectIds.knitButton, '🚀', 'Start knitting',
      () => {
        if (!this.configuring) return;
        this.configuring = false;
        this.configuringStateChange.notify();
      })
      .appendHtml(this.buttonsForm)
      .setEnabled(this.configuringStateChange, () => this.configuring);

    new ControlButton(
      objectIds.buttonPrev, '←', 'Previous row', () => this.addRow(-1))
      .appendHtml(this.buttonsForm)
      .setEnabled(this.stateChange, () => this.pattern != null && this.currentRow > 0);

    new ControlButton(
      objectIds.buttonNext, '→', 'Next row', () => this.addRow(+1))
      .appendHtml(this.buttonsForm)
      .setEnabled(this.stateChange, () => this.pattern != null && this.currentRow < (this.pattern?.rowsCount() ?? 0) - 1);

    const knitCanvas = document.createElement(htmlTags.canvas.slice(1, -1)) as HTMLCanvasElement;
    knitCanvas.id = 'knitCanvas';
    document.body.appendChild(knitCanvas);

    const controlsDiv = document.createElement(htmlTags.div.slice(1, -1));
    controlsDiv.id = 'controls';
    controlsDiv.appendChild(this.buttonsForm);
    document.body.appendChild(controlsDiv);

    const inputsDiv = document.createElement(htmlTags.div.slice(1, -1));
    inputsDiv.id = 'inputs';
    if (this.currentRow !== 0) {
      inputsDiv.style.display = cssDisplayValues.none;
    }
    inputsDiv.appendChild(document.createElement(htmlTags.form.slice(1, -1)));
    const factoryWarningsDiv = document.createElement(htmlTags.div.slice(1, -1));
    factoryWarningsDiv.id = objectIds.factoryWarnings;
    inputsDiv.appendChild(factoryWarningsDiv);
    document.body.appendChild(inputsDiv);

    const patternContainerDiv = document.createElement(htmlTags.div.slice(1, -1));
    patternContainerDiv.id = 'patternContainer';
    if (this.currentRow === 0) {
      patternContainerDiv.style.display = cssDisplayValues.none;
    } else {
      patternContainerDiv.style.display = cssDisplayValues.inline;
    }
    document.body.appendChild(patternContainerDiv);
  }

  private currentPatternFactory(): PatternFactory {
    const value = this.patternFactorySelector.value();
    const output = this.patternFactories.find(
      i => i.factoryName === value);
    if (!output) throw new Error('Didn\'t find pattern: ' + value);
    return output;
  }

  private configurationInputChanged(): boolean {
    const warningsDiv = document.getElementById(objectIds.factoryWarnings) as HTMLDivElement;
    warningsDiv.innerHTML = '';
    try {
      this.pattern = this.currentPatternFactory().build();
    } catch (error) {
      this.pattern = null;
      const pElement = document.createElement(htmlTags.p.slice(1, -1));
      pElement.textContent = String(error);
      warningsDiv.appendChild(pElement);
      console.error(error);
    }
    this.renderPattern();
    this.selectRow(this.currentRow);
    return false;
  }

  private updateLocationHash(): void {
    let fragments = this.patternFactoryInputs.map(
      i => i.hasDefaultValue() ? '' : `${i.nameCamelCase()}=${i.value()}`);
    if (this.currentRow !== 0)
      fragments.push(`${urlParams.row}=${this.currentRow}`);
    window.location.hash = fragments.filter(str => str !== '').join('&');
  }

  public selectRow(row: number): void {
    const isNewRow = this.currentRow !== row;
    this.currentRow = row;
    const canvas = document.getElementById('knitCanvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (this.pattern != null) {
      this.updateLocationHash();
      this.pattern.drawToCanvas(document.getElementById('knitCanvas') as HTMLCanvasElement, this.currentRow);
    } else {
      const knitCanvas = document.getElementById('knitCanvas') as HTMLCanvasElement;
      if (knitCanvas) {
        knitCanvas.innerHTML = '';
      }
    }

    const container = document.getElementById('patternContainer') as HTMLElement;
    Array.from(container.children).forEach(child => child.classList.remove('highlight'));
    const rowData = this.pattern!.rows[this.currentRow];
    if (rowData)
      rowData.visit();
    const selectedRow = container.children[this.currentRow] as HTMLElement;
    if (selectedRow) {
      selectedRow.classList.add('highlight');
      const rowTop = selectedRow.offsetTop + container.scrollTop;
      const paddingTop = Math.max(0, container.clientHeight - selectedRow.offsetHeight) / 3;
      container.scrollTop = Math.max(0, rowTop - paddingTop);
    }

    if (isNewRow) {
      this.configuring = false;
      this.configuringStateChange.notify();
      this.stateChange.notify();
    }
  }

  private renderPattern(): void {
    const container = document.getElementById('patternContainer') as HTMLElement;
    container.innerHTML = '';

    if (this.pattern === null) return;
    this.pattern.forEachRow((rowData: any, index: number) => {
      const divNormal = rowData.createDiv(index, this.pattern);
      container.appendChild(divNormal);
      divNormal.addEventListener('click', () => this.selectRow(index));
    });
  }

  // Refactor: Remove unused method
  // private scrollToRow(selectedRow: JQuery<HTMLElement>): void {}

  public addRow(delta: number): void {
    if (this.pattern == null) return;
    if (delta > 0 && this.currentRow < this.pattern.rows.length - 1)
      this.selectRow(this.currentRow + 1);
    if (delta < 0 && this.currentRow > 0)
      this.selectRow(this.currentRow - 1);
  }
}

const knitState = new KnitState();

/** WAKE LOCK LOGIC **/
let wakeLock: WakeLockSentinel | null = null;

async function requestWakeLock(): Promise<void> {
  try {
    if (wakeLock === null && 'wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock?.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch (err: any) {
    console.error(`Failed to acquire wake lock: ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', requestWakeLock);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  new SwipeHandler(
    () => knitState.addRow(1),
    () => knitState.addRow(-1)
  );
});

document.body.addEventListener('keydown', (e: KeyboardEvent) => {
  if (knitState.pattern == null) return;
  if (e.code === 'Space' || e.code === 'ArrowDown') {
    knitState.addRow(1);
    e.preventDefault();
  }
  if (e.code === 'ArrowUp') {
    knitState.addRow(-1);
    e.preventDefault();
  }
});
