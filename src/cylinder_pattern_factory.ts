import {PatternFactoryInput} from './inputs.js';
import {Pattern, type RowSwitchStyle, RowSwitchStyles} from './pattern.js';
import {PatternFactoryRegistry} from './pattern_factory_registry.js';
import {Row} from './row.js';
import {Knit, M1L, M1R, Purl, Stitch} from './stitch.js';
import {type KnitTexture, texturesMap} from './texture.js';

class Section {
  widthTop: PatternFactoryInput;
  widthBottom: PatternFactoryInput;
  texture: PatternFactoryInput;
  inputs: PatternFactoryInput[];
  knittingStyleInput: PatternFactoryInput;

  constructor(
      sectionId: number, sectionCountInput: PatternFactoryInput,
      knittingStyleInput: PatternFactoryInput) {
    this.widthTop = new PatternFactoryInput(
        `${sectionId}: Top Width`,
        `How wide should section ${sectionId} be at the top?`, 3, 'stitches');
    this.widthBottom = new PatternFactoryInput(
        `${sectionId}: Bottom Width`,
        `How wide should section ${sectionId} be at the bottom?`, 30,
        'stitches');
    this.texture = new PatternFactoryInput(
        `${sectionId}: Texture`,
        `What type of pattern should section ${sectionId} use?`, 'Stockinette',
        null, Array.from(texturesMap.keys()));
    this.inputs = [this.widthTop, this.widthBottom, this.texture];
    this.knittingStyleInput = knittingStyleInput;
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
      rowIndex: number, rowLength: number,
      separatorWidthInput: PatternFactoryInput): Stitch[] {
    const previousWidth = rowIndex === 0 ?
        this.widthTop.numberValue() :
        this.#getRowWidth(rowIndex - 1, rowLength);
    const desiredWidth = this.#getRowWidth(rowIndex, rowLength);
    const textureValue = this.texture.value();
    if (textureValue === undefined || typeof textureValue !== 'string') {
      throw new Error(`Invalid texture value: ${textureValue}`);
    }

    const currentIncreaseAmount =
        (desiredWidth > previousWidth) ? (desiredWidth - previousWidth) : 0;

    const rawTextureOutput: Stitch[] =
        this.#applyTexture(textureValue, rowIndex);

    // The core texture needs to be `desiredWidth - currentIncreaseAmount` long.
    // The `widthBottom` will be used as the base width for generating the
    // texture. The `startTrim` is to center the `desiredWidth` segment within
    // the `widthBottom`.
    const stitchesToExtract = desiredWidth - currentIncreaseAmount;
    const totalTrim = this.widthBottom.numberValue() - stitchesToExtract;
    const startTrim = totalTrim / 2;

    const centralTexture =
        rawTextureOutput.slice(startTrim, startTrim + stitchesToExtract);

    if (currentIncreaseAmount > 0) {
      return [M1R, ...centralTexture, M1L];
    }
    return centralTexture;
  }

  #getRowWidth(index: number, total: number): number {
    const widthTop = this.widthTop.numberValue();
    const rowRatio = index / (total - 1);
    const desiredWidth = Math.round(
        (1 - rowRatio) * widthTop + rowRatio * this.widthBottom.numberValue());
    // Total since the top.
    const desiredGrowth = desiredWidth - widthTop;
    // We can only grow by multiples of 2, so round it.
    return widthTop + (2 * Math.floor(desiredGrowth / 2));
  }

  #applyTexture(textureName: string, rowIndex: number): Stitch[] {
    const texture = texturesMap.get(textureName);
    if (!texture) {
      throw new Error(`Invalid texture: ${textureName}`);
    }
    // Always call buildStitches with the maximum width for the section to
    // ensure a consistent base texture, as per the updated plan.
    return texture.buildStitches(
        this.widthBottom.numberValue(),
        this.knittingStyleInput.value() as RowSwitchStyle, rowIndex);
  }
}

class CylinderPatternFactory {
  factoryName: string = 'Cylinder';
  knittingStyleInput: PatternFactoryInput;
  lengthInput: PatternFactoryInput;
  separatorWidthInput: PatternFactoryInput;
  sectionCountInput: PatternFactoryInput;
  sections: Section[];

  constructor() {
    this.knittingStyleInput = new PatternFactoryInput(
        'Knitting Style', 'Should the cylinder be knit in the round or flat?',
        RowSwitchStyles.round, null, Object.values(RowSwitchStyles));
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
        {length: 10},
        (_, index) => new Section(
            index, this.sectionCountInput, this.knittingStyleInput));
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.knittingStyleInput, this.lengthInput, this.separatorWidthInput,
      this.sectionCountInput, ...this.sections.flatMap((s) => s.getInputs())
    ];
  }

  #getSeparator(rowIndex: number): Stitch[] {
    const width = this.separatorWidthInput.numberValue();
    if (width <= 0)
      throw new Error('Invalid separator width (must be greater than 0).');
    return Array(width).fill(
        this.knittingStyleInput.value() as RowSwitchStyle ===
                    RowSwitchStyles.round ||
                rowIndex % 2 === 1 ?
            Knit :
            Purl);
  }

  build(): Pattern {
    const output = new Pattern();
    const knittingStyle = this.knittingStyleInput.value() as RowSwitchStyle;
    output.rowSwitchStyle = knittingStyle;

    for (let rowIndex = 0; rowIndex < this.lengthInput.numberValue();
         rowIndex++) {
      let stitches: Stitch[] = [];
      const normalOrder =
          knittingStyle === RowSwitchStyles.round || rowIndex % 2 === 0;
      for (let section = 0; section < this.sectionCountInput.numberValue();
           section++) {
        if (normalOrder) stitches.push(...this.#getSeparator(rowIndex));
        const actualSection = normalOrder ?
            section :
            this.sectionCountInput.numberValue() - section - 1;
        stitches.push(...this.sections[actualSection]!.getStitches(
            rowIndex, this.lengthInput.numberValue(),
            this.separatorWidthInput));
        if (!normalOrder) stitches.push(...this.#getSeparator(rowIndex));
      }
      output.addRow(new Row(stitches));
    }
    return output;
  }
}

PatternFactoryRegistry.register('Cylinder', CylinderPatternFactory);
