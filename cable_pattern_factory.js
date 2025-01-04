// 33     11          22      44
// 33     11          22      44
//  33     11        22      44
//   33      11    22      44
//     33      1122      44
//       33    2211    44
//         3322    1144
//         2233    4411
//        22   3344   11
//        22   4433   11
//         2244    3311
//           22    1133
//
//
//
//  11   5533    4422   66
// 11    3355    2244    66
// 11   33   5522   44   66
// 11   33   2255   44   66
// 11    3322    5544    66
//  11   2233    4455   66
//   1122    3344    5566
//   2211    4433    6655
//
//---
// 11
// 11
//  11   22
//   1122
//   2211
//  22  11
// 22    11
// 22    11
//      11
//     11

// 11
//  11
//    11
//     11
//     11
//    11
//  11
// 11
class CableLayout {
  // @param {number} cableEdgeRows - The number of rows on the edge where the
  // cable stays without moving. Typically 2.
  // @param {number} smoothingRows - The number of rows around the edge where
  // the cable only jumps 1 stitch (per row). Typically 1 or 2.
  constructor(cables, rowsBetweenCables, cableEdgeRows, smoothingRows) {
    // rowsBetweenCables: On the side, how much empty space should we leave
    // after one cable leaves the side before the next cable reaches it?
    this.cables = cables;
    this.cableWidth = 2;  // Stitches.
    this.rowsBetweenCables = rowsBetweenCables;
    this.cableEdgeRows = cableEdgeRows;
    this.smoothingRows = smoothingRows;
    this.rowsCount = cables * (this.cableEdgeRows + this.rowsBetweenCables);
    this.rowsWidth = this.#rowsWidth();
    console.log(this.rowsWidth);
    // positions[row][cable] stores the earliest position of the given cable at
    // a given row.
    this.positions = this.#cablePositions();
  }

  #rowsWidth() {
    const moveRows = 1 + this.rowsCount / 2 - this.cableEdgeRows;
    const singleMoveRows = Math.min(moveRows, 2 * this.smoothingRows);
    const doubleMoveRows = moveRows - singleMoveRows;
    return this.cableWidth + singleMoveRows + 2 * doubleMoveRows;
  }

  #cablePositions() {
    const output =
        Array.from({length: this.rowsCount}, () => Array(this.cables).fill(-1))
    for (let cable = 0; cable < this.cables; cable++) {
      const cableStartRow =
          cable * (this.cableEdgeRows + this.rowsBetweenCables);
      let position = 0;
      for (let row = 0; row < this.rowsCount / 2; row++) {
        output[(cableStartRow + row) % this.rowsCount][cable] = position;
        output[(cableStartRow + this.rowsCount / 2 + row) % this.rowsCount][cable] =
            this.rowsWidth - position - this.cableWidth;
        if (row < this.cableEdgeRows - 1)
          continue;
        else if (
            (row + 1 >= this.cableEdgeRows &&
             row + 1 < this.cableEdgeRows + this.smoothingRows) ||
            row + 1 > this.rowsCount / 2 - this.smoothingRows)
          position += 1;
        else
          position += 2;
      }
    }
    console.log(output);
    return output;
  }

  renderRowCables(row) {
    const output = Array(this.rowsWidth).fill(-1);
    for (let cable = 0; cable < this.cables; cable++) {
      output[this.positions[row][cable]] = cable;
      output[this.positions[row][cable] + 1] = cable;
    }
    console.log(output);
    return output;
  }
}

class CablePatternFactory {
  static name = 'Cables';

  constructor() {
    this.cableLengthInput = new PatternFactoryInput(
        'Cable Length', 'How long should the pattern be?', 1,
        'cable pattern rows');
    this.cableCountInput = new PatternFactoryInput(
        'Cable Count', 'How many cables do you want?', 5, 'cables');
    this.rowsBetweenCablesInput = new PatternFactoryInput(
        'Rows Between Cables', 'How many rows between cables?', 2, 'rows');
    this.cableEdgeRowsInput = new PatternFactoryInput(
        'Cable edge rows', 'Length of the edge of each cable', 2, 'rows');
    this.smoothingRowsInput = new PatternFactoryInput(
        'Single-stitch jump rows',
        'For how many rows should cables only jump a single stitch?', 1,
        'rows');
  }

  getInputs() {
    return [
      this.cableLengthInput,
      this.cableCountInput,
      this.rowsBetweenCablesInput,
      this.cableEdgeRowsInput,
      this.smoothingRowsInput,
    ];
  }

  build() {
    const output = new Pattern();
    const layout = new CableLayout(
        this.cableCountInput.numberValue(),
        this.rowsBetweenCablesInput.numberValue(),
        this.cableEdgeRowsInput.numberValue(),
        this.smoothingRowsInput.numberValue());
    const evenRow =
        new Row([new StitchSequence([StitchEcho], layout.rowsWidth)]);
    for (let row = 0; row < layout.rowsCount; row++) {
      const state = layout.renderRowCables(row);
      const stateNext = layout.renderRowCables((row + 1) % layout.rowsCount);
      const rowOutput = [];
      let stitch = layout.rowsWidth - 1;
      while (stitch >= 0) {
        if (state[stitch] == -1 && stateNext[stitch] == -1) {
          rowOutput.push(Purl);
          stitch--;
        } else if (
            stitch > 0 && state[stitch] == stateNext[stitch] &&
            state[stitch - 1] == stateNext[stitch - 1]) {
          rowOutput.push(new StitchSequence([Knit], 2));
          stitch -= 2;
        } else if (
            stitch >= 2 && state[stitch] != -1 && stateNext[stitch] == -1 &&
            state[stitch] == stateNext[stitch - 1]) {
          rowOutput.push(CableTwoFrontPurlOne);
          rowOutput.push(new StitchSequence([Knit], 2));
          stitch -= 3;
        } else if (
            stitch >= 2 && state[stitch] == -1 && stateNext[stitch] != -1 &&
            state[stitch - 1] == stateNext[stitch]) {
          rowOutput.push(CableOneBackKnitTwo);
          rowOutput.push(Purl);
          stitch -= 3;
        } else if (
            stitch >= 3 && state[stitch] != -1 && state[stitch - 2] != -1 &&
            state[stitch - 2] == stateNext[stitch] &&
            state[stitch] == stateNext[stitch - 3]) {
          rowOutput.push(CableTwoBackKnitTwo);
          rowOutput.push(new StitchSequence([Knit], 2));
          stitch -= 4;
        } else if (
            stitch >= 3 && state[stitch] != -1 && state[stitch - 2] == -1 &&
            state[stitch] == stateNext[stitch - 2]) {
          rowOutput.push(CableTwoFrontPurlTwo);
          rowOutput.push(new StitchSequence([Knit], 2));
          stitch -= 4;
        } else if (
            stitch >= 3 && state[stitch] == -1 && state[stitch - 2] != -1 &&
            stateNext[stitch] == state[stitch - 2]) {
          rowOutput.push(CableTwoBackKnitTwo);
          rowOutput.push(new StitchSequence([Purl], 2));
          stitch -= 4;
        } else {
          throw new Error('Unhandled cable cross situation');
        }
      }
      output.addRow(new Row(rowOutput));
      output.addRow(evenRow);
    }
    return output;
  }

  buildOld() {
    const output = new Pattern();
    const evenRow = new Row([
      new StitchSequence([WithYarnInFront, SlipStitchPurlwise], 1),
      new StitchSequence([StitchEcho], 23)
    ]);
    for (let i = 0; i < this.cableLengthInput.numberValue(); i++) {
      // Row 1
      output.addRow(new Row([
        new StitchSequence(
            [WithYarnInBack, SlipStitchPurlwise, Purl, CableTwoBackKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [Purl, Purl, Purl, Purl, CableTwoBackKnitTwo, Knit, Knit], 2),
        new StitchSequence([Purl], 2)
      ]));
      output.addRow(evenRow);
      // Row 3
      output.addRow(new Row([
        new StitchSequence(
            [WithYarnInBack, SlipStitchPurlwise, CableOneBackKnitTwo, Purl], 1),
        new StitchSequence(
            [CableTwoFrontPurlTwo, Knit, Knit, CableTwoBackKnitTwo, Purl, Purl],
            2),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 1),
      ]));
      output.addRow(evenRow);
      // Row 5
      output.addRow(new Row([
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 7
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableOneBackKnitTwo, Purl], 1),
        new StitchSequence([CableTwoFrontPurlTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([CableTwoBackKnitTwo], 1),
        new StitchSequence([Purl], 2),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 9
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoBackKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 11:
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [CableTwoBackKnitTwo, Purl, Purl, CableTwoFrontPurlTwo, Knit, Knit],
            1),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 4),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 13
      output.addRow(new Row([
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 1),
      ]));
      output.addRow(evenRow);
      // Row 15
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise], 1),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [CableTwoBackKnitTwo, Purl, Purl, CableTwoFrontPurlTwo, Knit, Knit],
            2),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 2),
      ]));
      output.addRow(evenRow);
    }
    return output;
  }
}