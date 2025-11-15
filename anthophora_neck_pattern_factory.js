import {CableLayout} from './cable_pattern_factory.js';
import {Pattern} from './pattern.js';
import {Row} from './row.js';

export class AnthophoraNeckPatternFactory {
  static name = 'Anthophora Neck';

  constructor() {
    this.neckFrontBaseWidthInput = new PatternFactoryInput(
        'Neck Front Base Width',
        'How wide should the pattern be at the bottom in the front?', 80,
        'stitches');
    this.neckBackBaseWidthInput = new PatternFactoryInput(
        'Neck Back Base Width',
        'How wide should the pattern be at the bottom in the back?', 120,
        'stitches');
    this.neckTopWidthInput = new PatternFactoryInput(
        'Neck Top Width', 'How wide should the pattern be at the top?', 120,
        'stitches');

    this.neckMarginTypeInput = new PatternFactoryInput(
        'Neck Border Type', 'How should the border be?', 'None', null,
        ['None', 'ICord', 'Knit']);

    this.neckFrontLength = new PatternFactoryInput(
        'Neck Front Length', 'How long should the front of the neck be?', 50,
        'rows');
    this.neckBackLengthInput = new PatternFactoryInput(
        'Neck Back Length', 'How long should the back of the neck be?', 56,
        'rows');

    this.neckFrontPatternInput = new PatternFactoryInput(
        'Neck Front Pattern',
        'What type of pattern should be at the center front?', 'Honeycomb',
        null, ['None', 'Honeycomb', 'Rib']);
    this.neckBackPatternInput = new PatternFactoryInput(
        'Neck Back Pattern',
        'What type of pattern should be at the center back?', 'Rib', null,
        ['None', 'Honeycomb', 'Rib']);

    this.neckTopWidthInput = new PatternFactoryInput(
        'Neck Top Width', 'How wide should the pattern be at the top?', 120,
        'stitches');

    this.neckFrontRibs = new PatternFactoryInput(
        'Neck Front Ribs',
        'How many ribs should we put around the central front pattern?', 2,
        'ribs');
    this.neckFrontRibs = new PatternFactoryInput(
        'Neck Back Ribs',
        'How many ribs should we put around the central back pattern?', 0,
        'ribs');
  }

  getInputs() {
    return [
      this.neckFrontBaseWidthInput,
      this.neckBackBaseWidthInput,
      this.neckTopWidthInput,
      this.neckMarginTypeInput,
      this.neckFrontLength,
      this.neckBackLengthInput,
      this.neckFrontPatternInput,
      this.neckBackPatternInput,
      this.neckTopWidthInput,
      this.neckFrontRibs,
      this.neckFrontRibs,
    ];
  }

  build() {
    const output = new Pattern();
    const marginType = this.marginTypeInput.value();
    const marginDistance =
        marginType == 'None' ? 0 : this.marginDistanceInput.numberValue();
    const layout = new CableLayout(
        this.cableCountInput.numberValue(),
        this.rowsBetweenCablesInput.numberValue(),
        this.cableEdgeRowsInput.numberValue(),
        this.smoothingRowsInput.numberValue(),
        this.innerCablesInput.value() == 'Enable', marginType, marginDistance);
    for (let row = 0; row < 2 * layout.rowsCount; row++)
      output.addRow(layout.computeRow(row));
    return output;
  }
}
