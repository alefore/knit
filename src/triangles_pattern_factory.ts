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

  getStitches(rowIndex: number, rowLength: number): Stitch[] {
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

class TrianglesPatternFactory {
  factoryName: string = 'Triangles';
  knittingStyleInput: PatternFactoryInput;
  lengthInput: PatternFactoryInput;
  sectionCountInput: PatternFactoryInput;
  sections: Section[];

  constructor() {
    this.knittingStyleInput = new PatternFactoryInput(
        'Knitting Style', 'Should the piece be knit in the round or flat?',
        RowSwitchStyles.round, null, Object.values(RowSwitchStyles));
    this.lengthInput = new PatternFactoryInput(
        'Length', 'How long should the set of triangles be?', 30, 'rows');
    this.sectionCountInput = new PatternFactoryInput(
        'Sections', 'How many sections should the polygon have?', 4,
        'sections');
    this.sections = Array.from(
        {length: 20},
        (_, index) => new Section(
            index, this.sectionCountInput, this.knittingStyleInput));
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.knittingStyleInput, this.lengthInput, this.sectionCountInput,
      ...this.sections.flatMap((s) => s.getInputs())
    ];
  }

  build(): Pattern {
    const output = new Pattern();
    const knittingStyle = this.knittingStyleInput.value() as RowSwitchStyle;
    output.rowSwitchStyle = knittingStyle;

    for (let rowIndex = 0; rowIndex < this.lengthInput.numberValue();
         rowIndex++) {
      let stitches: Stitch[] = [];
      const invertOrder =
          knittingStyle === RowSwitchStyles.backAndForth && rowIndex % 2 === 1;
      for (let section = 0; section < this.sectionCountInput.numberValue();
           section++) {
        const actualSection = invertOrder ?
            this.sectionCountInput.numberValue() - section - 1 :
            section;
        stitches.push(...this.sections[actualSection]!.getStitches(
            rowIndex, this.lengthInput.numberValue()));
      }
      output.addRow(new Row(stitches));
    }
    return output;
  }
}

PatternFactoryRegistry.register('Triangles', TrianglesPatternFactory);
