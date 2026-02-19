import {createConstants} from './constants.js';
import {PatternFactoryInput} from './inputs.js';
import {Pattern} from './pattern.js';
import {Row} from './row.js';
import {CableTwoBackKnitTwo, CableTwoFrontKnitTwo, Knit, M1L, M1R, Purl} from './stitch.js';
import {StitchSequence} from './stitch_sequence.js';

const textures =
    createConstants('Stockinette', 'Rib2x2', 'RibMistake', 'Honeycomb');

function listRepeating(input, desiredLen) {
  return Array.from(
      {length: desiredLen}, (_, index) => input[index % input.length]);
}

class Section {
  constructor(sectionId, sectionCountInput) {
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
        textures.Stockinette, null, [
          textures.Stockinette, textures.Rib2x2, textures.RibMistake,
          textures.Honeycomb
        ]);
    this.inputs = [this.widthTop, this.widthBottom, this.texture];
    this.inputs.forEach(
        (i) => i.addVisibilityRequirement(
            () => sectionCountInput.numberValue() > sectionId));
    sectionCountInput.listener.addListener(
        () => this.inputs.forEach((i) => i.adjustVisibility()));
  }

  getInputs() {
    return this.inputs;
  }

  getStitches(rowIndex, rowLength) {
    const widthTop = this.widthTop.numberValue();
    const widthBottom = this.widthBottom.numberValue();
    const previousWidth =
        rowIndex === 0 ? widthTop : this.#getRowWidth(rowIndex - 1, rowLength);
    const desiredWidth = this.#getRowWidth(rowIndex, rowLength);
    const output =
        this.#applyTexture(this.texture.value(), rowIndex, previousWidth);
    if (desiredWidth >= previousWidth + 2) return [M1R, ...output, M1L];
    return output;
  }

  #getRowWidth(index, total) {
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

  #getStitchesRib2x2(width) {
    const widthTop = this.widthTop.numberValue();
    const gap = (width - widthTop) / 2;
    const center = listRepeating([Knit, Knit, Purl, Purl], widthTop + gap);
    const start = listRepeating([Purl, Purl, Knit, Knit], gap).toReversed()
    const output = [...start, ...center];
    if (output.length != width)
      throw new Error(
          `"Internal error: unexpected length ${output.length} vs ${width}`);
    return output;
  }

  #applyTexture(texture, index, width) {
    if (texture === textures.Stockinette)
      return [new StitchSequence([Knit], width)];
    else if (texture === textures.Rib2x2) {
      return this.#getStitchesRib2x2(width);
    } else if (texture === textures.RibMistake) {
      if (this.separatorWidthInput.numberValue() === 0 && width % 4 != 0)
        throw new Error(
            `Width must be a multiple of 4 for texture ${texture}.`);
      const sequence =
          [new StitchSequence([Knit], 2), new StitchSequence([Purl], 2)];
      if (index % 2 == 0) return listRepeating(sequence, width / 2);
      return [Knit].concat(listRepeating(sequence, width / 2).slice(1)).concat([
        Knit
      ]);
    } else if (texture === textures.Honeycomb) {
      const widthTop = this.widthTop.value();
      const honeycombWidth = Math.floor(widthTop / 8) * 8;
      const sideWidth = (width - honeycombWidth) / 2;
      const side = sideWidth > 0 ? [new StitchSequence([Knit], sideWidth)] : [];
      return side.concat(honeycomb(index, honeycombWidth)).concat(side);
    } else {
      throw new Error(`Invalid texture: ${texture}`);
    }
  }
}

export class CylinderPatternFactory {
  static factoryName = 'Cylinder';

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

  getInputs() {
    return [
      this.lengthInput, this.separatorWidthInput, this.sectionCountInput,
      ...this.sections.flatMap((s) => s.getInputs())
    ];
  }

  #addSeparator(stitches) {
    const width = this.separatorWidthInput.numberValue();
    if (width <= 0)
      throw new Error('Invalid separator width (must be greater than 0).');
    stitches.push(new StitchSequence([Knit], width));
  }

  build() {
    const output = new Pattern().setRound();
    for (let rowIndex = 0; rowIndex < this.lengthInput.numberValue();
         rowIndex++) {
      let stitches = [];
      for (let section = 0; section < this.sectionCountInput.numberValue();
           section++) {
        this.#addSeparator(stitches);
        stitches.push(...this.sections[section].getStitches(
            rowIndex, this.lengthInput.numberValue()));
      }
      output.addRow(new Row(stitches));
    }
    return output;
  }
}

function honeycomb(rowId, width) {
  const step = rowId % 8;
  if (width % 2 != 0) throw new Error('Honeycomb requires even width.');
  if (step == 2)
    return listRepeating(
        [
          CableTwoBackKnitTwo,
          new StitchSequence([Knit], 2),
          CableTwoFrontKnitTwo,
          new StitchSequence([Knit], 2),
        ],
        width / 2);

  if (step == 6)
    return listRepeating(
        [
          CableTwoFrontKnitTwo,
          new StitchSequence([Knit], 2),
          CableTwoBackKnitTwo,
          new StitchSequence([Knit], 2),
        ],
        width / 2);

  return [new StitchSequence([Knit], width)];
}

/*function garterRow(rowId, stitches) {
  return new Row(
      [new StitchSequence([rowId % 2 === 0 ? Knit : Purl], stitches)]);
}*/

function row2x2(rowId, stitches) {
  const rightSide = rowId % 2 == 0;
  const rowBottomKnit = (rowId + 1) % 4 < 2;
  let head = [new StitchSequence(
      rightSide != rowBottomKnit ? [Knit, Knit, Purl, Purl] :
                                   [Purl, Purl, Knit, Knit],
      Math.floor(stitches / 4))];
  let tail = [];
  if (stitches % 4 >= 1) tail.push(rowBottomKnit ? Knit : Purl);
  if (stitches % 4 >= 2) tail.push(rowBottomKnit ? Knit : Purl);
  if (stitches % 4 == 3) tail.push(rowBottomKnit ? Purl : Knit);
  return new Row(
      !rightSide ? [...head, ...tail] : [...tail.reverse(), ...head]);
}
