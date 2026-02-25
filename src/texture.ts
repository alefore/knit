import {type RowSwitchStyle, RowSwitchStyles} from './pattern.js';
import {CableTwoBackKnitTwo, CableTwoFrontKnitTwo, Knit, Purl, Stitch} from './stitch.js';

export interface KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[];
}

function applyKnittingStyle(
    knittingStyle: RowSwitchStyle, rowIndex: number,
    pattern: Stitch[]): Stitch[] {
  if (knittingStyle === RowSwitchStyles.round || rowIndex % 2 === 0) {
    return pattern;
  }
  return pattern.reverse().map((s) => s === Knit ? Purl : Knit);
}


export class GarterStitch implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return Array(numberOfStitches)
        .fill(
            knittingStyle === RowSwitchStyles.backAndForth ||
                    rowIndex % 2 === 0 ?
                Knit :
                Purl);
  }
}

export class Stockinette implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return applyKnittingStyle(
        knittingStyle, rowIndex, Array(numberOfStitches).fill(Knit));
  }
}

function listRepeating(pattern: Stitch[], numberOfStitches: number): Stitch[] {
  const stitches: Stitch[] = [];
  let outputSize = 0;
  for (let i = 0; outputSize < numberOfStitches; i++) {
    const stitch = pattern[i % pattern.length]!;
    stitches.push(stitch);
    outputSize += stitch.outputStitches;
  }
  return stitches;
}

export class Rib1x1 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return applyKnittingStyle(
        knittingStyle, rowIndex, listRepeating([Knit, Purl], numberOfStitches));
  }
}

export class Rib2x2 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return applyKnittingStyle(
        knittingStyle, rowIndex,
        listRepeating([Knit, Knit, Purl, Purl], numberOfStitches));
  }
}

export class RibMistake implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    const sequence = rowIndex % 2 === 0 ? [Knit, Knit, Purl, Purl] :
                                          [Knit, Purl, Purl, Knit];
    return applyKnittingStyle(
        knittingStyle, rowIndex, listRepeating(sequence, numberOfStitches));
  }
}

export class DoubleMossStitch implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    const sequence =
        rowIndex % 4 < 2 ? [Knit, Knit, Purl, Purl] : [Purl, Purl, Knit, Knit];
    return applyKnittingStyle(
        knittingStyle, rowIndex, listRepeating(sequence, numberOfStitches));
  }
}

export class HoneycombCables implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    if (knittingStyle !== RowSwitchStyles.round) {
      throw new Error('HoneycombCables requires knitting in the round.');
    }
    const step = rowIndex % 8;
    if (step !== 2 && step !== 6) {
      return Array(numberOfStitches).fill(Knit);
    }
    // We need to handle odd numbers of stitches (make sure we don't output
    // CableTwoBackKnitTwo nor CableTwoFrontKnitTwo when it won't fit).
    const tail = numberOfStitches % 2 === 1 ? [Knit] : [];
    const sequence = step === 2 ?
        [CableTwoBackKnitTwo, Knit, Knit, CableTwoFrontKnitTwo, Knit, Knit] :
        [CableTwoFrontKnitTwo, Knit, Knit, CableTwoBackKnitTwo, Knit, Knit];
    return listRepeating(sequence, numberOfStitches - tail.length).concat(tail);
  }
}

export class Boneyard implements KnitTexture {
  private readonly stockinette = new Stockinette();

  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    if (rowIndex % 12 === 11) {
      return Array(numberOfStitches)
          .fill(knittingStyle === RowSwitchStyles.round ? Purl : Knit);
    }
    return this.stockinette.buildStitches(
        numberOfStitches, knittingStyle, rowIndex);
  }
}

export const texturesMap: Map<string, KnitTexture> = new Map([
  ['GarterStitch', new GarterStitch()],
  ['Stockinette', new Stockinette()],
  ['Rib1x1', new Rib1x1()],
  ['Rib2x2', new Rib2x2()],
  ['RibMistake', new RibMistake()],
  ['DoubleMossStitch', new DoubleMossStitch()],
  ['HoneycombCables', new HoneycombCables()],
  ['Boneyard', new Boneyard()],
]);
