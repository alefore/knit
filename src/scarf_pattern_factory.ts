import {PatternFactoryInput} from './inputs.js';
import {cubicBezierArray} from './math.js';
import {Pattern, RowSwitchStyles} from './pattern.js';
import {PatternFactoryRegistry} from './pattern_factory_registry.js';
import {Row} from './row.js';
import {Knit, KnitFrontBack, KnitTwoTogether, Purl, Stitch} from './stitch.js';
import {type KnitTexture, texturesMap} from './texture.js';

interface Point {
  x: number;
  y: number;
}

type CubicBezierFocalPoints = {
  [key: string]: [Point, Point];
};

const TRUE_STRING = 'true';
const FALSE_STRING = 'false';

class ScarfPatternFactory {
  static cubicBezierFocalPoints: CubicBezierFocalPoints = {
    Balanced: [{x: 0.6, y: 0.3}, {x: 0.4, y: 0.7}],
    Thin: [{x: 0.75, y: 0.3}, {x: 0.5, y: 0.7}],
    Thick: [{x: 0.5, y: 0.3}, {x: 0.25, y: 0.7}],
    Straight: [{x: 0.5, y: 0.5}, {x: 0.5, y: 0.5}],
  };

  factoryName = 'Sophie Scarf';

  borderStitches: number = 3;
  rowsInput: PatternFactoryInput;
  centerLengthInput: PatternFactoryInput;
  centerWidthInput: PatternFactoryInput;
  textureInput: PatternFactoryInput;
  shapeInput: PatternFactoryInput;
  /**
   * Whether the increases and decreases should be symmetric. If true, increases
   * and decreases occur on even rows. If false, increases occur on even rows
   * and decreases on odd rows.
   */
  symmetricInput: PatternFactoryInput;

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
        Array.from(texturesMap.keys())[0] as string, null,
        Array.from(texturesMap.keys()));
    this.shapeInput = new PatternFactoryInput(
        'Shape', 'What general shape would you like?',
        Object.keys(ScarfPatternFactory.cubicBezierFocalPoints)[0] as string,
        null, Object.keys(ScarfPatternFactory.cubicBezierFocalPoints));
    this.symmetricInput = new PatternFactoryInput(
        'Symmetric', 'Should the increases and decreases be symmetric?',
        TRUE_STRING, null, [TRUE_STRING, FALSE_STRING]);
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.rowsInput, this.centerLengthInput, this.centerWidthInput,
      this.textureInput, this.shapeInput, this.symmetricInput
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
        ScarfPatternFactory
            .cubicBezierFocalPoints[this.shapeInput.value() as string];
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

    let growType: Stitch|null = null;
    if (previousStitches < desiredStitches) {
      if (atEvenRow) {
        growType = KnitFrontBack;
      }
    } else if (previousStitches > desiredStitches) {
      if (this.symmetricInput.value() === TRUE_STRING) {
        if (atEvenRow) {
          growType = KnitTwoTogether;
        }
      } else {
        if (!atEvenRow) {
          growType = KnitTwoTogether;
        }
      }
    }

    const allTextureStitches =
        texturesMap.get(this.textureInput.value() as string)!.buildStitches(
            this.centerWidthInput.numberValue(), RowSwitchStyles.backAndForth,
            pattern.rows.length);
    const stitchesToKeep =
        previousStitches - (growType === KnitTwoTogether ? 1 : 0);
    const slicedStitches = atEvenRow ?
        allTextureStitches.reverse().slice(0, stitchesToKeep).reverse() :
        allTextureStitches.slice(0, stitchesToKeep);
    pattern.addRow(new Row(slicedStitches).borderWrap(growType));
  }
}

PatternFactoryRegistry.register('Scarf', ScarfPatternFactory);
