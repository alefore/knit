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
//  22   1144    3366   55
// 22    4411    6633    55
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

// 01234567890123456789012345
// 00       33
// 00         3311         33
//   123456789
class CableLayout {
  // @param {number} cableEdgeRows - The number of rows on the edge where the
  // cable stays without moving. Typically 2.
  // @param {number} smoothingRows - The number of rows around the edge where
  // the cable only jumps 1 stitch (per row). Typically 1 or 2.
  // @param {bool} innerCables - Should we add inner cables? They don't reach
  // the edges, but oscillate between the normal cables.
  constructor(
      cables, rowsBetweenCables, cableEdgeRows, smoothingRows, innerCables) {
    // rowsBetweenCables: On the side, how much empty space should we leave
    // after one cable leaves the side before the next cable reaches it?
    this.cables = cables;
    this.innerCables = innerCables;
    this.cableWidth = 2;  // Stitches.
    this.rowsBetweenCables = rowsBetweenCables;
    this.cableEdgeRows = cableEdgeRows;
    this.smoothingRows = smoothingRows;
    this.rowsCount = cables * (this.cableEdgeRows + this.rowsBetweenCables);
    this.rowsWidth = this.#rowsWidth();
    // positions[row][cable] stores the earliest position of the given cable at
    // a given row.
    this.positions = this.#cablePositions();
    this.positionsInnerCables = this.#innerCablePositions();
    console.log(this.positions);
    console.log(this.positionsInnerCables);
  }

  #rowsWidth() {
    const moveRows = 1 + this.rowsCount / 2 - this.cableEdgeRows;
    const singleMoveRows = Math.min(moveRows, 2 * this.smoothingRows);
    const doubleMoveRows = moveRows - singleMoveRows;
    return this.cableWidth + singleMoveRows + 2 * doubleMoveRows;
  }

  #cablePositions() {
    const output =
        Array.from({length: this.rowsCount}, () => Array(this.cables).fill(-1));
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
    return output;
  }

  #innerCablePositions() {
    if (!this.innerCables)
      return Array.from({length: this.rowsCount + 1}, () => []);
    const cablesCount = this.cables - 2;
    const output = Array.from(
        {length: this.rowsCount + 1}, () => Array(cablesCount).fill(-1));
    const cableIntersections = (this.cables - 2) / 2;
    const cableStartStitch = Math.floor(
        this.rowsWidth / (cableIntersections + 1) / 2 - this.cableWidth / 2);
    for (let cable = 0; cable < cablesCount; cable += 2) {
      const cableStartRow = (this.cableEdgeRows + this.rowsBetweenCables) *
              Math.floor(cable / 2) +
          Math.floor(this.cableEdgeRows / 4);
      console.log(cableStartRow);
      let direction = 1;  // 1 or -1.
      let position = cableStartStitch;
      for (let row = 0; row < this.rowsCount + 1; row++) {
        if (cableStartRow - row >= 0) {
          output[cableStartRow - row][cable] = position;
          output[cableStartRow - row][cable + 1] =
              this.rowsWidth - position - this.cableWidth;
        }
        if (cableStartRow + row + 1 < this.rowsCount + 1) {
          output[cableStartRow + row + 1][cable] = position;
          output[cableStartRow + row + 1][cable + 1] =
              this.rowsWidth - position - this.cableWidth;
        }
        if (row < this.cableEdgeRows / 4 - 1)
          continue;
        else if (position == cableStartStitch) {
          if (direction == 1)
            position += 1;
          else
            direction = 1;
        } else if (
            direction == 1 &&
            position + 1 == this.rowsWidth - cableStartStitch - this.cableWidth)
          position += direction;
        else if (direction == -1 && position - 1 == cableStartStitch)
          position += direction;
        else if (
            position + this.cableWidth == this.rowsWidth - cableStartStitch)
          if (direction == -1)
            position += direction;
          else
            direction = -1;
        else
          position += 2 * direction;
      }
    }
    return output;
  }

  renderRowCables(row) {
    const output = Array(this.rowsWidth).fill(-1);
    function Mark(cable, position) {
      if (output[position] != -1)
        throw new Error(
            'Unable to render row cables: ' + cable + ' ' + output[position] +
            ' at row ' + row + ' position ' + position);
      output[position] = cable;
    };

    for (let cable = 0; cable < this.cables; cable++) {
      Mark(cable, this.positions[row % this.positions.length][cable]);
      Mark(cable, this.positions[row % this.positions.length][cable] + 1);
    }
    if (this.innerCables)
      for (let cable = 0; cable < this.cables - 2; cable++) {
        Mark(this.cables + cable, this.positionsInnerCables[row][cable]);
        Mark(this.cables + cable, this.positionsInnerCables[row][cable] + 1);
      }
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
    this.innerCablesInput = new PatternFactoryInput(
        'Inner Cables',
        'Should we enable inner cables? These only works with few parameters.',
        'Disable', null, ['Enable', 'Disable']);
    this.marginDistanceInput = new PatternFactoryInput(
        'Margin Distance',
        'Number of purl stitches between the cable and its margin. ' +
            'If zero, disables margin.',
        2, 'stitches');
  }

  getInputs() {
    return [
      this.cableLengthInput,
      this.cableCountInput,
      this.rowsBetweenCablesInput,
      this.cableEdgeRowsInput,
      this.smoothingRowsInput,
      this.innerCablesInput,
      this.marginDistanceInput,
    ];
  }

  build() {
    const output = new Pattern();
    const layout = new CableLayout(
        this.cableCountInput.numberValue(),
        this.rowsBetweenCablesInput.numberValue(),
        this.cableEdgeRowsInput.numberValue(),
        this.smoothingRowsInput.numberValue(),
        this.innerCablesInput.value() == 'Enable');
    const marginDistance = this.marginDistanceInput.numberValue();
    const evenRow = new Row([new StitchSequence(
        [StitchEcho],
        layout.rowsWidth +
            (marginDistance > 0 ? 2 * (marginDistance + 2) : 0))]);
    for (let row = 0; row < layout.rowsCount; row++) {
      const state = layout.renderRowCables(row);
      console.log(state);
      const stateNext = layout.renderRowCables(row + 1);
      const rowOutput = marginDistance > 0 ?
          [
            new StitchSequence([Knit], 2),
            new StitchSequence([Purl], marginDistance)
          ] :
          [];
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
          console.log(state);
          console.log(stateNext);
          console.log(`Row ${row}, stitch ${stitch}.`);
          throw new Error(`Unhandled cable cross situation (row ${
              row * 2}, stitch ${stitch}).`);
        }
      }
      if (marginDistance > 0) {
        rowOutput.push(new StitchSequence([Purl], marginDistance));
        rowOutput.push(new StitchSequence([Knit], 2));
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