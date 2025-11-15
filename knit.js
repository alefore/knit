import {AnthophoraNeckPatternFactory} from './anthophora_neck_pattern_factory.js';
import {CablePatternFactory} from './cable_pattern_factory.js';
import {CapeletPatternFactory} from './capelet_pattern_factory.js';
import {ScarfPatternFactory} from './scarf_pattern_factory.js';
import {SwipeHandler} from './swipe.js';

const objectIds = createConstants(
    'configureButton', 'factoryWarnings', 'knitButton', 'buttonNext',
    'buttonPrev');

class ControlButton {
  constructor(id, text, description, action) {
    this.text = text;
    this.description = description;
    this.htmlObject = $(htmlTags.input, {
                        type: htmlInputTypes.submit,
                        value: this.text,
                        title: this.description,
                      }).click(action);
  }

  appendHtml(container) {
    container.append(this.htmlObject);
    return this;
  }

  setEnabled(stateListener, value) {
    const htmlObject = this.htmlObject;
    stateListener.addListener(function() {
      htmlObject.prop(htmlProps.disabled, !value());
    });
  }
}

class KnitState {
  constructor() {
    const knitState = this;
    this.inputs = parseHash();
    this.patternFactories = [
      new ScarfPatternFactory(3),
      new CablePatternFactory(),
      new CapeletPatternFactory(),
    ];

    const factoryNames = Array.from(new Set(this.patternFactories.map(
        instance => Object.getPrototypeOf(instance).constructor.name)));
    this.patternFactorySelector = new PatternFactoryInput(
        'Pattern', 'Pattern', this.patternFactories[0].constructor.name, null,
        factoryNames);

    this.currentRow = Number(this.inputs[urlParams.row] ?? 0);
    this.configuringStateChange = new EventListener();
    this.stateChange = new EventListener();
    this.buttonsForm = $(htmlTags.form).submit(function(e) {
      return false;
    });
    this.configuring = this.currentRow === 0;

    this.configuringStateChange.addListener(function() {
      $('#inputs').css(
          cssProps.display,
          knitState.configuring ? cssDisplayValues.inline :
                                  cssDisplayValues.none);
      $('#patternContainer')
          .css(
              cssProps.display,
              knitState.configuring ? cssDisplayValues.none :
                                      cssDisplayValues.inline);
    });

    new ControlButton(null, '📖', 'About this software', function() {
      window.open('http://github.com/alefore/knit', '_blank');
    }).appendHtml(this.buttonsForm);

    new ControlButton(
        objectIds.configureButton, '⚙️', 'Configure the pattern',
        function(e) {
          if (knitState.configuring) return;
          knitState.configuring = true;
          knitState.configuringStateChange.notify();
        })
        .appendHtml(this.buttonsForm)
        .setEnabled(this.configuringStateChange, () => !knitState.configuring);
    new ControlButton(
        objectIds.knitButton, '🚀', 'Start knitting',
        function(e) {
          if (!knitState.configuring) return;
          knitState.configuring = false;
          knitState.configuringStateChange.notify();
        })
        .appendHtml(this.buttonsForm)
        .setEnabled(this.configuringStateChange, () => knitState.configuring);
    new ControlButton(
        objectIds.buttonPrev, '←', 'Previous row', (e) => knitState.addRow(-1))
        .appendHtml(this.buttonsForm)
        .setEnabled(
            this.stateChange,
            () => knitState.pattern != null && knitState.currentRow > 0);
    new ControlButton(
        objectIds.buttonNext, '→', 'Next row', (e) => knitState.addRow(+1))
        .appendHtml(this.buttonsForm)
        .setEnabled(
            this.stateChange,
            () => this.pattern != null &&
                this.currentRow < this.pattern.rowsCount() - 1);
    $('body')
        .append($('<canvas>', {id: 'knitCanvas'}))
        .append($(htmlTags.div, {id: 'controls'}).append(this.buttonsForm))
        .append($(htmlTags.div, {
                  id: 'inputs',
                  style: knitState.currentRow === 0 ? '' : 'display:none',
                })
                    .append($(htmlTags.form))
                    .append($(htmlTags.div, {id: objectIds.factoryWarnings})))
        .append($(htmlTags.div, {
          id: 'patternContainer',
          style: knitState.currentRow === 0 ? 'display:none' : 'display:inline'
        }));

    drawInputs(this.#allFactoryInputs(), knitState.inputs);
    this.patternFactories.forEach(function(factory) {
      factory.getInputs().forEach(
          input => input.setVisible(
              knitState.patternFactorySelector.listener,
              () => knitState.patternFactorySelector.value() ===
                  Object.getPrototypeOf(factory).constructor.name))
    });
    knitState.#allFactoryInputs().forEach(
        (input) => input.listener.addListener(
            () => knitState.#configurationInputChanged()));
    knitState.patternFactorySelector.listener.notify();
    knitState.configuringStateChange.notify();
    knitState.#configurationInputChanged();
    knitState.stateChange.notify();
    knitState.selectRow(this.currentRow);
    knitState.#renderPattern();
  }

  #currentPatternFactory() {
    const value = this.patternFactorySelector.value();
    const output = this.patternFactories.find(
        i => Object.getPrototypeOf(i).constructor.name === value);
    if (!output) throw new Error('Didn\'t find pattern: ' + value);
    return output;
  }

  #allFactoryInputs() {
    const knitState = this;
    const output = [this.patternFactorySelector];
    this.patternFactories.forEach(function(factory) {
      output.push(...factory.getInputs());
    });
    return output;
  }

  #configurationInputChanged() {
    const knitState = this;
    const warningsDiv = $('#' + objectIds.factoryWarnings).empty();
    try {
      knitState.pattern = knitState.#currentPatternFactory().build();
    } catch (error) {
      knitState.pattern = null;
      warningsDiv.append($(htmlTags.p).text(error));
      console.log(error);
    }
    knitState.selectRow(knitState.currentRow);
    return false;
  }

  #parseHash() {
    const hash = window.location.hash.substring(1);  // Remove the '#' character
    const params = {};
    hash.split('&').forEach(part => {
      const item = part.split('=');
      params[item[0]] = decodeURIComponent(item[1]);
    });
    return params;
  }

  #updateLocationHash() {
    let fragments = this.#allFactoryInputs().map(
        i => i.hasDefaultValue() ? '' : `${i.nameCamelCase()}=${i.value()}`);
    if (this.currentRow != 0)
      fragments.push(`${urlParams.row}=${this.currentRow}`);
    window.location.hash = fragments.filter(str => str !== '').join('&');
  }

  selectRow(row) {
    const updatedRow = this.currentRow != row;
    this.currentRow = row;
    const canvas = $('#knitCanvas')[0];
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if (this.pattern != null) {
      this.#updateLocationHash();
      this.pattern.drawToCanvas(
          document.getElementById('knitCanvas'), this.currentRow);
    } else {
      $('#knitCanvas').empty();
    }
    this.#renderPattern();
    if (updatedRow) {
      knitState.configuring = false;
      knitState.configuringStateChange.notify();
      this.stateChange.notify();
    }
  }

  #renderPattern() {
    const container = $('#patternContainer');
    container.empty();

    if (this.pattern === null) return;
    let selectedRow = null;

    this.pattern.forEachRow((rowData, index) => {
      const divNormal =
          rowData.createDiv(index, index === this.currentRow, this.pattern);
      if (index === this.currentRow) {
        selectedRow = divNormal;
      }
      container.append(divNormal);
      divNormal.click(() => {
        this.selectRow(index);
      });
    });

    if (selectedRow === null) selectedRow = container.children(0);

    const rowTop = selectedRow.position().top + container.scrollTop();
    const paddingTop =  // Leave 1/3 above current row, 2/3 below.
        Math.max(0, container.innerHeight() - selectedRow.outerHeight()) / 3;

    container.scrollTop(Math.max(0, rowTop - paddingTop));
  }

  addRow(delta) {
    if (this.pattern == null) return;
    if (delta > 0 && this.currentRow < this.pattern.rows.length - 1)
      this.selectRow(this.currentRow + 1);
    if (delta < 0 && this.currentRow > 0) this.selectRow(this.currentRow - 1);
  }
};

const knitState = new KnitState();

let wakeLock = null;

async function requestWakeLock() {
  try {
    if (wakeLock === null) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock acquired');
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock released');
        wakeLock = null;
      });
    }
  } catch (err) {
    console.error(`Failed to acquire wake lock: ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', requestWakeLock);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

document.addEventListener('DOMContentLoaded', (event) => {
  new SwipeHandler(
      function() {
        knitState.addRow(1);
      },
      function() {
        knitState.addRow(-1);
      });
});

document.body.addEventListener('keydown', function(e) {
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
