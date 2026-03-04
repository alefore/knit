// Import pattern factories to ensure they are registered.
import './cable_pattern_factory.js';
import './capelet_pattern_factory.js';
import './cylinder_pattern_factory.js';
import './scarf_pattern_factory.js';

import {cssDisplayValues, cssProps, htmlInputTypes, htmlProps, htmlTags, urlParams} from './constants.js';
import {ControlButton} from './control_button.js';
import {drawInputs, parseHash, PatternFactoryInput} from './inputs.js';
import {EventListener} from './listener.js';
import {Pattern, type PatternFactory} from './pattern.js';
import {PatternCanvasView} from './pattern_canvas_view.js';
import {PatternFactoryRegistry} from './pattern_factory_registry.js';
import {SwipeHandler} from './swipe.js';

const objectIds = {
  configureButton: 'configureButton',
  factoryWarnings: 'factoryWarnings',
  knitButton: 'knitButton',
  buttonNext: 'buttonNext',
  buttonPrev: 'buttonPrev',
} as const;

class KnitState {
  private inputs: URLSearchParams;
  private patternFactories: PatternFactory[];
  private patternFactorySelector: PatternFactoryInput;
  private patternFactoryInputs: PatternFactoryInput[];
  private patternCanvasView: PatternCanvasView;

  public currentRow: number;
  public configuringStateChange: EventListener;
  public stateChange: EventListener;
  public buttonsForm: HTMLFormElement;
  public configuring: boolean;
  public pattern: Pattern|null = null;

  constructor() {
    this.inputs = parseHash();
    this.patternFactories =
        PatternFactoryRegistry.getAllFactories().map(Factory => new Factory());

    const factoryNames = Array.from(
        new Set(this.patternFactories.map(instance => instance.factoryName)));

    const firstFactoryName = this.patternFactories[0]!.factoryName;

    this.patternFactorySelector = new PatternFactoryInput(
        'Pattern', 'Pattern', firstFactoryName, null, factoryNames);

    this.patternFactoryInputs = [this.patternFactorySelector];

    this.patternFactories.forEach((factory) => {
      const newInputs = factory.getInputs();
      newInputs.forEach(
          (input) => input.addVisibilityRequirement(
              () =>
                  this.patternFactorySelector.value() === factory.factoryName));
      this.patternFactoryInputs.push(...newInputs);
    });

    this.patternFactorySelector.listener.addListener(() => {
      this.patternFactoryInputs.forEach((input) => input.adjustVisibility());
    });

    this.patternFactoryInputs.forEach(
        (input) =>
            input.listener.addListener(() => this.configurationInputChanged()));

    this.currentRow = Number(this.inputs.get(urlParams.row) ?? 0);
    this.configuringStateChange = new EventListener();
    this.stateChange = new EventListener();
    this.buttonsForm = document.createElement(htmlTags.form) as HTMLFormElement;
    this.buttonsForm.addEventListener('submit', (event) => {
      event.preventDefault();
    });
    this.configuring = this.currentRow === 0;
    this.patternCanvasView =
        new PatternCanvasView((row: number) => this.selectRow(row));
    document.body.appendChild(this.patternCanvasView.getCanvas());

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
    this.patternCanvasView.selectRow(this.pattern, this.currentRow);
  }

  private setupUI(): void {
    new ControlButton(
        null, '📖', 'About this software',
        () => {
          window.open('http://github.com/alefore/knit', '_blank');
        })
        .appendHtml(this.buttonsForm)
        .setVisibility(this.configuringStateChange, () => this.configuring);

    new ControlButton(
        objectIds.configureButton, '⚙️', 'Configure the pattern',
        () => {
          if (this.configuring) return;
          this.configuring = true;
          this.configuringStateChange.notify();
        })
        .appendHtml(this.buttonsForm)
        .setVisibility(this.configuringStateChange, () => !this.configuring);

    new ControlButton(
        objectIds.knitButton, '🚀', 'Start knitting',
        () => {
          if (!this.configuring) return;
          this.configuring = false;
          this.configuringStateChange.notify();
        })
        .appendHtml(this.buttonsForm)
        .setVisibility(this.configuringStateChange, () => this.configuring);

    new ControlButton(
        objectIds.buttonPrev, '←', 'Previous row', () => this.addRow(-1))
        .appendHtml(this.buttonsForm)
        .setEnabled(
            this.stateChange, () => this.pattern != null && this.currentRow > 0)
        .setVisibility(this.configuringStateChange, () => !this.configuring);

    new ControlButton(
        objectIds.buttonNext, '→', 'Next row', () => this.addRow(+1))
        .appendHtml(this.buttonsForm)
        .setEnabled(
            this.stateChange,
            () => this.pattern != null &&
                this.currentRow < (this.pattern?.rowsCount() ?? 0) - 1)
        .setVisibility(this.configuringStateChange, () => !this.configuring);

    this.patternCanvasView.initializeCanvasControls(this.buttonsForm);

    const controlsDiv = document.createElement(htmlTags.div);
    controlsDiv.id = 'controls';
    controlsDiv.appendChild(this.buttonsForm);
    document.body.appendChild(controlsDiv);

    const inputsDiv = document.createElement(htmlTags.div);
    inputsDiv.id = 'inputs';
    if (this.currentRow !== 0) {
      inputsDiv.style.display = cssDisplayValues.none;
    }
    inputsDiv.appendChild(document.createElement(htmlTags.form));
    const factoryWarningsDiv = document.createElement(htmlTags.div);
    factoryWarningsDiv.id = objectIds.factoryWarnings;
    inputsDiv.appendChild(factoryWarningsDiv);
    document.body.appendChild(inputsDiv);

    const patternContainerDiv = document.createElement(htmlTags.div);
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
    const output = this.patternFactories.find(i => i.factoryName === value);
    if (!output) throw new Error('Didn\'t find pattern: ' + value);
    return output;
  }

  private configurationInputChanged(): boolean {
    const warningsDiv =
        document.getElementById(objectIds.factoryWarnings) as HTMLDivElement;
    warningsDiv.innerHTML = '';
    try {
      this.pattern = this.currentPatternFactory().build();
    } catch (error) {
      this.pattern = null;
      const pElement = document.createElement(htmlTags.p);
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

    if (this.pattern != null) {
      this.updateLocationHash();
      this.patternCanvasView.selectRow(this.pattern, this.currentRow);
    } else {
      this.patternCanvasView.drawPattern(null);  // Clear canvas if no pattern
    }

    const container =
        document.getElementById('patternContainer') as HTMLElement;
    Array.from(container.children)
        .forEach(child => child.classList.remove('highlight'));
    const rowData = this.pattern!.rows[this.currentRow];
    if (rowData) rowData.visit();
    const selectedRow = container.children[this.currentRow] as HTMLElement;
    if (selectedRow) {
      selectedRow.classList.add('highlight');
      const rowTop = selectedRow.offsetTop;
      const paddingTop =
          Math.max(0, container.clientHeight - selectedRow.offsetHeight) / 3;
      container.scrollTop = Math.max(0, rowTop - paddingTop);
    }

    if (isNewRow) {
      this.configuring = false;
      this.configuringStateChange.notify();
      this.stateChange.notify();
    }
  }

  private renderPattern(): void {
    const container =
        document.getElementById('patternContainer') as HTMLElement;
    container.innerHTML = '';

    if (this.pattern === null) return;
    this.pattern.forEachRow((rowData: any, index: number) => {
      const divNormal = rowData.createDiv(index, this.pattern);
      container.appendChild(divNormal);
      divNormal.addEventListener('click', () => this.selectRow(index));
    });
  }


  public addRow(delta: number): void {
    if (this.pattern == null) return;
    if (delta > 0 && this.currentRow < this.pattern.rows.length - 1)
      this.selectRow(this.currentRow + 1);
    if (delta < 0 && this.currentRow > 0) this.selectRow(this.currentRow - 1);
  }
}

const knitState = new KnitState();

/** WAKE LOCK LOGIC **/
let wakeLock: WakeLockSentinel|null = null;

async function requestWakeLock(): Promise<void> {
  try {
    if (wakeLock === null && 'wakeLock' in navigator && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
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
  new SwipeHandler(() => knitState.addRow(1), () => knitState.addRow(-1));
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
