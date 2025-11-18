import {Pattern} from './pattern.js';
import {Row} from './row.js';

const textures =
    createConstants('Stockinette', 'Rib2x2', 'RibMistake', 'Honeycomb');

function listRepeating(input, desiredLen) {
  return Array.from(
      {length: desiredLen}, (_, index) => input[index % input.length]);
}

export class CylinderPatternFactory {
  static name = 'Cylinder';

  constructor() {
    this.lengthInput = new PatternFactoryInput(
        'Length', 'How long should the cylinder be?', 30, 'rows');
    this.separatorWidthInput = new PatternFactoryInput(
        'Separator Width',
        'How wide should the separator (between front and back parts) be?', 2,
        'stitches');
    this.topFrontWidthInput = new PatternFactoryInput(
        'Top Front Width',
        'How wide should the pattern be at the top in the front?', 20,
        'stitches');
    this.topBackWidthInput = new PatternFactoryInput(
        'Top Back Width',
        'How wide should the pattern be at the top in the back?', 20,
        'stitches');
    this.bottomFrontWidthInput = new PatternFactoryInput(
        'Bottom Front Width',
        'How wide should the pattern be at the bottom in the front?', 20,
        'stitches');
    this.bottomBackWidthInput = new PatternFactoryInput(
        'Bottom Back Width',
        'How wide should the pattern be at the bottom in the back?', 20,
        'stitches');
    this.frontTextureInput = new PatternFactoryInput(
        'Front Texture', 'What type of pattern to use at the front?',
        'RibMistake', null, [
          textures.Stockinette, textures.Rib2x2, textures.RibMistake,
          textures.Honeycomb
        ]);
  }

  getInputs() {
    return [
      this.lengthInput,
      this.separatorWidthInput,
      this.topFrontWidthInput,
      this.topBackWidthInput,
      this.bottomFrontWidthInput,
      this.bottomBackWidthInput,
      this.frontTextureInput,
    ];
  }

  #addSeparator(stitches) {
    const width = this.separatorWidthInput.numberValue();
    if (width < 0)
      throw new Error('Invalid separator width (must be greater than 0).');
    if (width > 0) stitches.push(new StitchSequence([Knit], width));
  }

  #addSection(
      widthTop, widthBottom, stitchesFactory, rowIndex, currentWidth,
      stitches) {
    const rowRatio = rowIndex / (this.lengthInput.numberValue() - 1);
    const desiredWidth = (1 - rowRatio) * widthTop + rowRatio * widthBottom;
    if (desiredWidth < currentWidth + 2) {
      stitches.push(...stitchesFactory(rowIndex, currentWidth));
      return currentWidth;
    }
    stitches.push(M1R);
    stitches.push(...stitchesFactory(rowIndex, currentWidth));
    stitches.push(M1L);
    return currentWidth + 2;
  }

  #frontStitches(texture, index, width) {
    if (texture === textures.Stockinette)
      return [new StitchSequence([Knit], width)];
    else if (texture === textures.Rib2x2) {
      if (this.separatorWidthInput.numberValue() === 0 && width % 4 != 0)
        throw new Error(
            `Width must be a multiple of 4 for texture ${texture}.`);
      return listRepeating(
          [new StitchSequence([Knit], 2), new StitchSequence([Purl], 2)],
          width / 2);
    } else if (texture === textures.RibMistake) {
      if (this.separatorWidthInput.numberValue() === 0 && width % 4 != 0)
        throw new Error(
            `Width must be a multiple of 4 for texture ${texture}.`);
      const sequence =
          [new StitchSequence([Knit], 2), new StitchSequence([Purl], 2)];
      var st;
      if (index % 2 == 0) return listRepeating(sequence, width / 2);
      return [Knit].concat(listRepeating(sequence, width / 2).slice(1)).concat([
        Knit
      ]);
    } else if (texture === textures.Honeycomb) {
      return honeycomb(index, width)
    } else {
      throw new Error(`Invalid texture: ${texture}`);
    }
  }

  #backStitches(index, width) {
    return [new StitchSequence([Knit], width)];
  }

  build() {
    const output = new Pattern().setRound();

    let frontWidth = this.topFrontWidthInput.numberValue();
    let backWidth = this.topBackWidthInput.numberValue();
    const ratioFront = frontWidth / (frontWidth + backWidth);
    for (let i = 0; i < this.lengthInput.numberValue(); i++) {
      let stitches = [];

      this.#addSeparator(stitches);
      frontWidth = this.#addSection(
          this.topFrontWidthInput.numberValue(),
          this.bottomFrontWidthInput.numberValue(), (index, width) => {
            return this.#frontStitches(
                this.frontTextureInput.value(), index, width);
          }, i, frontWidth, stitches);
      this.#addSeparator(stitches);
      backWidth = this.#addSection(
          this.topBackWidthInput.numberValue(),
          this.bottomBackWidthInput.numberValue(), this.#backStitches, i,
          backWidth, stitches);

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
