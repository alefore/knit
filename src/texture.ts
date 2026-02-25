import {type RowSwitchStyle, RowSwitchStyles} from './pattern.js';
import {CableTwoBackKnitTwo, CableTwoFrontKnitTwo, Knit, Purl, Stitch} from './stitch.js';

export interface KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[];
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
    return Array(numberOfStitches)
        .fill(
            knittingStyle === RowSwitchStyles.round || rowIndex % 2 === 0 ?
                Knit :
                Purl);
  }
}

function rib(pattern: Stitch[], numberOfStitches: number) {
  const stitches: Stitch[] = [];
  for (let i = 0; i < numberOfStitches; i++) {
    stitches.push(pattern[i % pattern.length]!);
  }
  return stitches;
}

function applyKnittingStyle(
    knittingStyle: RowSwitchStyle, rowIndex: number,
    pattern: Stitch[]): Stitch[] {
  if (knittingStyle === RowSwitchStyle.round || rowIndex % 2 === 0)
    return pattern;
  return pattern.reversed().map((s) => return s === Knit ? Purl : Knit);
}

export class Rib1x1 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return applyKnittingStyle(
        knittingStyle, rowIndex, rib([Knit, Purl], numberOfStitches));
  }
}

export class Rib2x2 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return applyKnittingStyle(
        knittingStyle, rowIndex,
        rib([Knit, Knit, Purl, Purl], numberOfStitches));
  }
}

export class RibMistake implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    const sequence = rowIndex % 2 === 0 ? [Knit, Knit, Purl, Purl] :
                                          [Knit, Purl, Purl, Knit];
    return applyKnittingStyle(
        knittingStyle, rowIndex, rib(sequence, numberOfStitches));
  }
}

export class DoubleMossStitch implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    const sequence =
        rowIndex % 4 < 2 ? [Knit, Knit, Purl, Purl] : [Purl, Purl, Knit, Knit];
    return applyKnittingStyle(
        knittingStyle, rowIndex,
        rib([Knit, Knit, Purl, Purl], numberOfStitches));
  }
}

export class HoneycombCables implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    if (numberOfStitches % 2 !== 0) {
      throw new Error('HoneycombCables requires an even number of stitches.');
    }
    if (knittingStyle !== RowSwitchStyles.round) {
      throw new Error('HoneycombCables requires knitting in the round.');
    }
    const step = rowIndex % 8;
    if (step === 2) {
      return rib(
          [CableTwoBackKnitTwo, Knit, Knit, CableTwoFrontKnitTwo, Knit, Knit],
          numberOfStitches);
    }
    if (step === 6) {
      return rib(
          [CableTwoFrontKnitTwo, Knit, Knit, CableTwoBackKnitTwo, Knit, Knit],
          numberOfStitches);
    }
    return Array(numberOfStitches).fill(Knit);
  }
}
