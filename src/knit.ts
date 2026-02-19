import { CablePatternFactory } from './cable_pattern_factory.js';
import { CapeletPatternFactory } from './capelet_pattern_factory.js';
import { createConstants, cssDisplayValues, cssProps, htmlInputTypes, htmlProps, htmlTags, urlParams } from './constants.js';
import { CylinderPatternFactory } from './cylinder_pattern_factory.js';
import { drawInputs, parseHash, PatternFactoryInput } from './inputs.js';
import { EventListener } from './listener.js';
import { ScarfPatternFactory } from './scarf_pattern_factory.js';
import { SwipeHandler } from './swipe.js';
import { Pattern } from './pattern.js';

interface PatternFactory {
  factoryName: string;
  getInputs(): PatternFactoryInput[];
  build(): Pattern;
}

const objectIds = createConstants(
  'configureButton', 'factoryWarnings', 'knitButton', 'buttonNext',
  'buttonPrev'
);

class ControlButton {
  private text: string;
  private description: string;
  private htmlObject: any;

  constructor(id: string | null, text: string, description: string, action: (e: JQuery.ClickEvent) => void) {
    this.text = text;
    this.description = description;
    this.htmlObject = $(htmlTags.input, {
      type: htmlInputTypes.submit,
      value: this.text,
      title: this.description,
    }).click(action);
  }

  appendHtml(container: any): this {
    container.append(this.htmlObject);
    return this;
  }

  setEnabled(stateListener: EventListener, value: () => boolean): void {
    const htmlObject = this.htmlObject;
    stateListener.addListener(() => {
      htmlObject.prop(htmlProps.disabled, !value());
    });
  }
}

class KnitState {
  private inputs: Record<string, string>;
  private patternFactories: PatternFactory[];
  private patternFactorySelector: PatternFactoryInput;
  private patternFactoryInputs: PatternFactoryInput[];

  public currentRow: number;
  public configuringStateChange: EventListener;
  public stateChange: EventListener;
  public buttonsForm: any;
  public configuring: boolean;
  public pattern: Pattern | null = null;

  constructor() {
    this.inputs = parseHash();
    this.patternFactories = [
      new ScarfPatternFactory(3),
      new CablePatternFactory(),
      new CapeletPatternFactory(),
      new CylinderPatternFactory(),
    ];

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

    this.currentRow = Number(this.inputs[urlParams.row] ?? 0);
    this.configuringStateChange = new EventListener();
    this.stateChange = new EventListener();
    this.buttonsForm = $(htmlTags.form).submit(() => false);
    this.configuring = this.currentRow === 0;

    this.configuringStateChange.addListener(() => {
      $('#inputs').css(
        cssProps.display,
        this.configuring ? cssDisplayValues.inline : cssDisplayValues.none);
      $('#patternContainer').css(
        cssProps.display,
        this.configuring ? cssDisplayValues.none : cssDisplayValues.inline);
    });

    this.setupUI();

    drawInputs(this.patternFactoryInputs, this.inputs);
    this.patternFactorySelector.listener.notify();
    this.configuringStateChange.notify();
    this.configurationInputChanged();
    this.stateChange.notify();
    this.selectRow(this.currentRow);
    this.renderPattern();
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

    $('body')
      .append($('<canvas>', { id: 'knitCanvas' }))
      .append($(htmlTags.div, { id: 'controls' }).append(this.buttonsForm))
      .append($(htmlTags.div, {
        id: 'inputs',
        style: this.currentRow === 0 ? '' : 'display:none',
      })
        .append($(htmlTags.form))
        .append($(htmlTags.div, { id: objectIds.factoryWarnings })))
      .append($(htmlTags.div, {
        id: 'patternContainer',
        style: this.currentRow === 0 ? 'display:none' : 'display:inline'
      }));
  }

  private currentPatternFactory(): PatternFactory {
    const value = this.patternFactorySelector.value();
    const output = this.patternFactories.find(
      i => i.factoryName === value);
    if (!output) throw new Error('Didn\'t find pattern: ' + value);
    return output;
  }

  private configurationInputChanged(): boolean {
    const warningsDiv = $('#' + objectIds.factoryWarnings).empty();
    try {
      this.pattern = this.currentPatternFactory().build();
    } catch (error) {
      this.pattern = null;
      warningsDiv.append($(htmlTags.p).text(String(error)));
      console.error(error);
    }
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
    const canvas = $('#knitCanvas')[0] as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (this.pattern != null) {
      this.updateLocationHash();
      this.pattern.drawToCanvas(document.getElementById('knitCanvas') as HTMLCanvasElement, this.currentRow);
    } else {
      $('#knitCanvas').empty();
    }

    this.renderPattern();

    if (isNewRow) {
      this.configuring = false;
      this.configuringStateChange.notify();
      this.stateChange.notify();
    }
  }

  private renderPattern(): void {
    const container = $('#patternContainer');
    container.empty();

    if (this.pattern === null) return;
    let selectedRow: any = null;

    this.pattern.forEachRow((rowData: any, index: number) => {
      const divNormal = rowData.createDiv(index, index === this.currentRow, this.pattern);
      if (index === this.currentRow) {
        selectedRow = divNormal;
      }
      container.append(divNormal);
      divNormal.click(() => this.selectRow(index));
    });

    if (selectedRow === null) selectedRow = container.children().first();
    if (!selectedRow.length) return;

    const rowTop = selectedRow.position().top + container.scrollTop();
    const paddingTop = Math.max(0, (container.innerHeight() ?? 0) - (selectedRow.outerHeight() ?? 0)) / 3;
    container.scrollTop(Math.max(0, rowTop - paddingTop));
  }

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