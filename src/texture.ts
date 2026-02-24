import {type RowSwitchStyle, RowSwitchStyles} from './pattern.js';
import {Knit, Purl, Stitch} from './stitch.js';

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

function rib(pattern: Stitch[], numberOfStitches: number, startIndex: number) {
  const stitches: Stitch[] = [];
  for (let i = 0; i < numberOfStitches; i++) {
    stitches.push(pattern[(i + startIndex) % pattern.length]!);
  }
  return stitches;
}

export class Rib1x1 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return rib(
        [Knit, Purl], numberOfStitches,
        knittingStyle === RowSwitchStyles.round ? 0 :
                                                  2 - (numberOfStitches % 2));
  }
}

export class Rib2x2 implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    return rib(
        [Knit, Knit, Purl, Purl], numberOfStitches,
        knittingStyle === RowSwitchStyles.round ? 0 :
                                                  4 - (numberOfStitches % 4));
  }
}

export class DoubleMossStitch implements KnitTexture {
  buildStitches(
      numberOfStitches: number, knittingStyle: RowSwitchStyle,
      rowIndex: number): Stitch[] {
    const indexDeltaFromPattern = rowIndex % 4 < 2 ? 0 : 2;
    const totalDelta = indexDeltaFromPattern +
        (knittingStyle === RowSwitchStyles.round || rowIndex % 2 === 1 ?
             0 :
             4 - (numberOfStitches % 4));
    return rib([Knit, Knit, Purl, Purl], numberOfStitches, totalDelta);
  }
}
