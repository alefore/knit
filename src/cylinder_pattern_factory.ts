import {PatternFactoryInput} from './inputs.js';
import {Pattern, RowSwitchStyles} from './pattern.js';
import {Row} from './row.js';
import {Knit, M1L, M1R, Stitch} from './stitch.js';
import {type KnitTexture, HoneycombCables, Rib2x2, RibMistake, Stockinette} from './texture.js';
import {PatternFactoryRegistry} from './pattern_factory_registry.js';

const texturesMap: Map<string, KnitTexture> = new Map([
  ['Stockinette', new Stockinette()],
  ['Rib2x2', new Rib2x2()],
  ['RibMistake', new RibMistake()],
  ['Honeycomb', new HoneycombCables()],
]);

class Section {
  widthTop: PatternFactoryInput;
  widthBottom: PatternFactoryInput;
  texture: PatternFactoryInput;
  inputs: PatternFactoryInput[];

  constructor(sectionId: number, sectionCountInput: PatternFactoryInput) {
    this.widthTop = new PatternFactoryInput(
        `${sectionId}: Top Width`,
        `How wide should section ${sectionId} be at the top?`, 3, 'stitches');
    this.widthBottom = new PatternFactoryInput(
        `${sectionId}: Bottom Width`,
        `How wide should section ${sectionId} be at the bottom?`, 30,
        'stitches');
    this.texture = new PatternFactoryInput(
        `${sectionId}: Texture`,
        `What type of pattern should section ${sectionId} use?`,
        'Stockinette',
        null,
        [
          'Stockinette', 'Rib2x2', 'RibMistake',
          'Honeycomb'
        ]);
    this.inputs = [this.widthTop, this.widthBottom, this.texture];
    this.inputs.forEach(
        (i) => i.addVisibilityRequirement(
            () => sectionCountInput.numberValue() > sectionId));
    sectionCountInput.listener.addListener(
        () => this.inputs.forEach((i) => i.adjustVisibility()));
  }

  getInputs(): PatternFactoryInput[] {
    return this.inputs;
  }

  getStitches(
      rowIndex: number, rowLength: number, separatorWidthInput: PatternFactoryInput): Stitch[] {
    const widthTop = this.widthTop.numberValue();
    const widthBottom = this.widthBottom.numberValue();
    const previousWidth =
        rowIndex === 0 ? widthTop : this.#getRowWidth(rowIndex - 1, rowLength);
    const desiredWidth = this.#getRowWidth(rowIndex, rowLength);
    const textureValue = this.texture.value();
    if (textureValue === undefined || typeof textureValue !== 'string') {
      throw new Error(`Invalid texture value: ${textureValue}`);
    }
    const output: Stitch[] =
        this.#applyTexture(textureValue, rowIndex, previousWidth);
    if (desiredWidth >= previousWidth + 2) return [M1R, ...output, M1L];
    return output;
  }

  #getRowWidth(index: number, total: number): number {
    const widthTop = this.widthTop.numberValue();
    const widthBottom = this.widthBottom.numberValue();
    const rowRatio = index / (total - 1);
    const desiredWidth =
        Math.round((1 - rowRatio) * widthTop + rowRatio * widthBottom);
    // Total since the top.
    const desiredGrowth = desiredWidth - widthTop;
    // We can only grow by multiples of 2, so round it.
    return widthTop + (2 * Math.floor(desiredGrowth / 2));
  }

  #applyTexture(textureName: string, rowIndex: number, width: number): Stitch[] {
    const texture = texturesMap.get(textureName);
    if (!texture) {
      throw new Error(`Invalid texture: ${textureName}`);
    }
    return texture.buildStitches(width, RowSwitchStyles.round, rowIndex);
  }
}

class CylinderPatternFactory {
  factoryName: string = 'Cylinder';
  lengthInput: PatternFactoryInput;
  separatorWidthInput: PatternFactoryInput;
  sectionCountInput: PatternFactoryInput;
  sections: Section[];

  constructor() {
    this.lengthInput = new PatternFactoryInput(
        'Length', 'How long should the cylinder be?', 30, 'rows');
    this.separatorWidthInput = new PatternFactoryInput(
        'Separator Width',
        'How wide should the separator (between front and back parts) be?', 2,
        'stitches');
    this.sectionCountInput = new PatternFactoryInput(
        'Sections', 'How many sections should the polygon have?', 4,
        'sections');
    this.sections = Array.from(
        {length: 10}, (_, index) => new Section(index, this.sectionCountInput));
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.lengthInput, this.separatorWidthInput, this.sectionCountInput,
      ...this.sections.flatMap((s) => s.getInputs())
    ];
  }

  #addSeparator(stitches: Stitch[]): void {
    const width = this.separatorWidthInput.numberValue();
    if (width <= 0)
      throw new Error('Invalid separator width (must be greater than 0).');
    stitches.push(...Array(width).fill(Knit));
  }

  build(): Pattern {
    const output = new Pattern().setRound();
    for (let rowIndex = 0; rowIndex < this.lengthInput.numberValue();
         rowIndex++) {
      let stitches: Stitch[] = [];
      for (let section = 0; section < this.sectionCountInput.numberValue();
           section++) {
        this.#addSeparator(stitches);
        stitches.push(...this.sections[section]!.getStitches(
            rowIndex, this.lengthInput.numberValue(), this.separatorWidthInput));
      }
      output.addRow(new Row(stitches));
    }
    return output;
  }
}

PatternFactoryRegistry.register('Cylinder', CylinderPatternFactory);
