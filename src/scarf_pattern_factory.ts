import {PatternFactoryInput} from './inputs.js';
import {cubicBezierArray} from './math.js';
import {Pattern, RowSwitchStyles} from './pattern.js';
import {Row} from './row.js';
import {Knit, KnitFrontBack, KnitTwoTogether, Purl, Stitch} from './stitch.js';
import {PatternFactoryRegistry} from './pattern_factory_registry.js';
import {type KnitTexture, GarterStitch, DoubleMossStitch} from './texture.js';

interface Point {
  x: number;
  y: number;
}

type CubicBezierFocalPoints = {
  [key: string]: [Point, Point];
};

class ScarfPatternFactory {
  static cubicBezierFocalPoints: CubicBezierFocalPoints = {
    Balanced: [{x: 0.6, y: 0.3}, {x: 0.4, y: 0.7}],
    Thin: [{x: 0.75, y: 0.3}, {x: 0.5, y: 0.7}],
    Thick: [{x: 0.5, y: 0.3}, {x: 0.25, y: 0.7}],
    Straight: [{x: 0.5, y: 0.5}, {x: 0.5, y: 0.5}],
  };

  static textures: {[key: string]: KnitTexture} = {
    'Garter': new GarterStitch(),
    'Double moss': new DoubleMossStitch(),
  };

  factoryName = 'Sophie Scarf';

  borderStitches: number = 3;
  rowsInput: PatternFactoryInput;
  centerLengthInput: PatternFactoryInput;
  centerWidthInput: PatternFactoryInput;
  textureInput: PatternFactoryInput;
  shapeInput: PatternFactoryInput;

  constructor() {
    this.rowsInput = new PatternFactoryInput(
        'Total Length',
        'How long should the scarf measure from tip to top along its ' +
            'longest dimension?',
        412, 'rows');
    this.centerLengthInput = new PatternFactoryInput(
        'Center Length',
        'How many additional rows should the scarf have in the center part ' +
            '(between increases and decreases) along the long dimension?',
        0, 'rows');
    this.centerWidthInput = new PatternFactoryInput(
        'Center Width',
        'How many stitches should the scarf have in the center part, ' +
            'between the increases and decreases?' +
            ' Does not include the 6 stitches for the i-cord border.',
        25, 'stitches');
    this.textureInput = new PatternFactoryInput(
        'Texture', 'What type of texture do you want?',
        Object.keys(ScarfPatternFactory.textures)[0] as string, null,
        Object.keys(ScarfPatternFactory.textures));
    this.shapeInput = new PatternFactoryInput(
        'Shape', 'What general shape would you like?',
        Object.keys(ScarfPatternFactory.cubicBezierFocalPoints)[0] as string, null,
        Object.keys(ScarfPatternFactory.cubicBezierFocalPoints));
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.rowsInput, this.centerLengthInput, this.centerWidthInput,
      this.textureInput, this.shapeInput
    ];
  }

  build(): Pattern {
    if (this.centerLengthInput.numberValue() > this.rowsInput.numberValue())
      throw new Error(`${this.centerLengthInput.name} (${
          this.centerLengthInput
              .numberValue()}) must smaller than or equal to ${
          this.rowsInput.name} (${this.rowsInput.numberValue()})`);

    const stitchesPerRow = this.#computeStitchesPerRow();
    const output = new Pattern();
    stitchesPerRow.forEach((value: number) => this.#addRow(output, value));
    for (let row = 0; row < this.centerLengthInput.numberValue(); row++)
      this.#addRow(output, this.centerWidthInput.numberValue());
    stitchesPerRow.reverse().forEach(
        (value: number) => this.#addRow(output, value));
    return output;
  }

  #computeStitchesPerRow(): number[] {
    const rowsPerSide = Math.floor(
        (this.rowsInput.numberValue() - this.centerLengthInput.numberValue()) /
        2);
    const coordinates =
        ScarfPatternFactory.cubicBezierFocalPoints[this.shapeInput.value() as string];
    const p0 = {x: 0, y: 0};
    const p1 = {
      x: coordinates![0].x * rowsPerSide,
      y: coordinates![0].y * this.centerWidthInput.numberValue()
    };
    const p2 = {
      x: coordinates![1].x * rowsPerSide,
      y: coordinates![1].y * this.centerWidthInput.numberValue()
    };
    const p3 = {x: rowsPerSide, y: this.centerWidthInput.numberValue()};
    return cubicBezierArray(rowsPerSide, p0, p1, p2, p3);
  }

  #addRow(pattern: Pattern, desiredStitches: number) {
    const totalBorderStitches = this.borderStitches * 2;
    const previousStitches = pattern.isEmpty() ?
        0 :
        pattern.lastRow().outputStitches - totalBorderStitches;
    const atEvenRow = pattern.rowsCount() % 2 == 0;

    let growType: Stitch | null = null;
    if (atEvenRow && previousStitches < desiredStitches)
      growType = KnitFrontBack;
    else if (atEvenRow && previousStitches > desiredStitches)
      growType = KnitTwoTogether;

    const texture = ScarfPatternFactory.textures[this.textureInput.value() as string]!;
    const stitches = texture.buildStitches(
        previousStitches - (growType === KnitTwoTogether ? 1 : 0),
        RowSwitchStyles.backAndForth,
        pattern.rows.length);

    pattern.addRow(new Row(stitches).borderWrap(growType));
  }
}

PatternFactoryRegistry.register('Scarf', ScarfPatternFactory);
