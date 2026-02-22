import {PatternFactoryInput} from './inputs.js';
import {Pattern} from './pattern.js';
import {Row} from './row.js';
import {CableOneBackKnitTwo, CableTwoBackKnitTwo, CableTwoFrontPurlOne, CableTwoFrontPurlTwo, Knit, Purl, SlipStitchPurlwise, StitchEcho, WithYarnInFront, Stitch} from './stitch.js';

export class CableLayout {
  cables: number;
  innerCables: boolean;
  cableWidth: number = 2; // Stitches.
  rowsBetweenCables: number;
  cableEdgeRows: number;
  smoothingRows: number;
  rowsCount: number;
  rowsWidth: number;
  positions: number[][]; // positions[row][cable]
  positionsInnerCables: number[][];
  marginType: 'None' | 'ICord' | 'Knit';
  marginDistance: number;

  constructor(
      cables: number, rowsBetweenCables: number, cableEdgeRows: number,
      smoothingRows: number, innerCables: boolean,
      marginType: 'None' | 'ICord' | 'Knit', marginDistance: number) {
    this.cables = cables;
    this.innerCables = innerCables;
    this.rowsBetweenCables = rowsBetweenCables;
    this.cableEdgeRows = cableEdgeRows;
    this.smoothingRows = smoothingRows;
    this.rowsCount = cables * (this.cableEdgeRows + this.rowsBetweenCables);
    this.rowsWidth = this.#rowsWidth();
    this.positions = this.#cablePositions();
    this.positionsInnerCables = this.#innerCablePositions();
    this.marginType = marginType;
    this.marginDistance = marginDistance;
  }

  #rowsWidth(): number {
    const moveRows = 1 + this.rowsCount / 2 - this.cableEdgeRows;
    const singleMoveRows = Math.min(moveRows, 2 * this.smoothingRows);
    const doubleMoveRows = moveRows - singleMoveRows;
    return this.cableWidth + singleMoveRows + 2 * doubleMoveRows;
  }

  #cablePositions(): number[][] {
    const output: number[][] =
        Array.from({length: this.rowsCount}, () => Array(this.cables).fill(-1));
    for (let cable = 0; cable < this.cables; cable++) {
      const cableStartRow =
          cable * (this.cableEdgeRows + this.rowsBetweenCables);
      let position = 0;
      for (let row = 0; row < this.rowsCount / 2; row++) {
        const currentRowIndex1 = (cableStartRow + row) % this.rowsCount;
        const targetRow1 = output[currentRowIndex1];
        if (targetRow1 !== undefined) {
          targetRow1[cable] = position;
        }
        const currentRowIndex2 = (cableStartRow + this.rowsCount / 2 + row) % this.rowsCount;
        const targetRow2 = output[currentRowIndex2];
        if (targetRow2 !== undefined) {
          targetRow2[cable] =
              this.rowsWidth - position - this.cableWidth;
        }
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

  #innerCablePositions(): number[][] {
    if (!this.innerCables)
      return Array.from({length: this.rowsCount + 1}, () => []);
    const cablesCount = this.cables - 2;
    const output: number[][] = Array.from(
        {length: this.rowsCount + 1}, () => Array(cablesCount).fill(-1));
    const cableIntersections = (this.cables - 2) / 2;
    const cableStartStitch = Math.floor(
        this.rowsWidth / (cableIntersections + 1) / 2 - this.cableWidth / 2);
    for (let cable = 0; cable < cablesCount; cable += 2) {
      const cableStartRow = (this.cableEdgeRows + this.rowsBetweenCables) *
              Math.floor(cable / 2) +
          Math.floor(this.cableEdgeRows / 4);
      console.log(cableStartRow);
      let direction = 1; // 1 or -1.
      let position = cableStartStitch;
      for (let row = 0; row < this.rowsCount + 1; row++) {
        if (cableStartRow - row >= 0) {
          const targetRow = output[cableStartRow - row];
          if (targetRow !== undefined) {
            targetRow[cable] = position;
            targetRow[cable + 1] =
                this.rowsWidth - position - this.cableWidth;
          }
        }
        if (cableStartRow + row + 1 < this.rowsCount + 1) {
          const targetRow = output[cableStartRow + row + 1];
          if (targetRow !== undefined) {
            targetRow[cable] = position;
            targetRow[cable + 1] =
                this.rowsWidth - position - this.cableWidth;
          }
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

  renderRowCables(row: number): number[] {
    const output: number[] = Array(this.rowsWidth).fill(-1);
    const Mark = (cable: number, position: number) => {
      if (position < 0 || position >= output.length) return; // Prevent out-of-bounds access
      if (output[position] !== -1)
        throw new Error(
            'Unable to render row cables: ' + cable + ' ' + output[position] +
            ' at row ' + row + ' position ' + position);
      output[position] = cable;
    };

    for (let cable = 0; cable < this.cables; cable++) {
      const cablePositions = this.positions[row % this.positions.length];
      const pos = cablePositions ? cablePositions[cable] : undefined;
      if (pos !== undefined) {
        Mark(cable, pos);
        Mark(cable, pos + 1);
      }
    }
    if (this.innerCables)
      for (let cable = 0; cable < this.cables - 2; cable++) {
        const innerCablePositions = this.positionsInnerCables[row];
        const innerPos = innerCablePositions ? innerCablePositions[cable] : undefined;
        if (innerPos !== undefined) {
          Mark(this.cables + cable, innerPos);
          Mark(this.cables + cable, innerPos + 1);
        }
      }
    return output;
  }

  computeRow(row: number): Row {
    return (row % 2 == 0) ? this.#cablesRow(row / 2) : this.#lameRow();
  }

  #cablesRow(row: number): Row {
    if (row >= this.positions.length)
      throw new Error('Row too large for cable!');
    const state = this.renderRowCables(row);
    const stateNext = this.renderRowCables(row + 1);
    const rowOutput: Stitch[] = this.marginType == 'None' ? [] : [
      ...Array(this.marginType == 'Knit' ? 2 : 3).fill(Knit),
      ...Array(this.marginDistance).fill(Purl)
    ];
    let stitch = this.rowsWidth - 1;
    while (stitch >= 0) {
      if (state[stitch] === -1 && stateNext[stitch] === -1) {
        rowOutput.push(Purl);
        stitch--;
      } else if (
          stitch > 0 && state[stitch] === stateNext[stitch] &&
          state[stitch - 1] === stateNext[stitch - 1]) {
        rowOutput.push(Knit, Knit);
        stitch -= 2;
      } else if (
          stitch >= 2 && state[stitch] !== -1 && stateNext[stitch] === -1 &&
          state[stitch] === stateNext[stitch - 1]) {
        rowOutput.push(CableTwoFrontPurlOne);
        rowOutput.push(Knit, Knit);
        stitch -= 3;
      } else if (
          stitch >= 2 && state[stitch] === -1 && stateNext[stitch] !== -1 &&
          state[stitch - 1] === stateNext[stitch]) {
        rowOutput.push(CableOneBackKnitTwo);
        rowOutput.push(Purl);
        stitch -= 3;
      } else if (
          stitch >= 3 && state[stitch] !== -1 && state[stitch - 2] !== -1 &&
          state[stitch - 2] === stateNext[stitch] &&
          state[stitch] === stateNext[stitch - 3]) {
        rowOutput.push(CableTwoBackKnitTwo);
        rowOutput.push(Knit, Knit);
        stitch -= 4;
      } else if (
          stitch >= 3 && state[stitch] !== -1 && state[stitch - 2] === -1 &&
          state[stitch] === stateNext[stitch - 2]) {
        rowOutput.push(CableTwoFrontPurlTwo);
        rowOutput.push(Knit, Knit);
        stitch -= 4;
      } else if (
          stitch >= 3 && state[stitch] === -1 && state[stitch - 2] !== -1 &&
          stateNext[stitch] === state[stitch - 2]) {
        rowOutput.push(CableTwoBackKnitTwo);
        rowOutput.push(Purl, Purl);
        stitch -= 4;
      } else {
        console.log(state);
        console.log(stateNext);
        console.log(`Row ${row}, stitch ${stitch}.`);
        throw new Error(`Unhandled cable cross situation (row ${
            row * 2}, stitch ${stitch}).`);
      }
    }
    rowOutput.push(...Array(this.marginDistance).fill(Purl));
    if (this.marginType == 'ICord') {
      const slipStitches: Stitch[] = [];
      for (let i = 0; i < 3; i++) slipStitches.push(SlipStitchPurlwise);
      rowOutput.push(WithYarnInFront, ...slipStitches);
    } else if (this.marginType == 'Knit')
      rowOutput.push(Knit, Knit);
    return new Row(rowOutput);
  }

  #lameRow(): Row {
    const slipStitches: Stitch[] = [];
    for (let i = 0; i < 3; i++) slipStitches.push(SlipStitchPurlwise);

    const marginEnd =
        (this.marginType == 'ICord' ?
             [WithYarnInFront, ...slipStitches] :
             [] as Stitch[]);
    return new Row([
      ...(this.marginType == 'ICord' ? Array(3).fill(Knit) :
                                    [] as Stitch[]),
      ...Array(
          this.rowsWidth +
          (this.marginDistance > 0 ? 2 * this.marginDistance +
                   (this.marginType == 'Knit' ? 4 : 0) : 0))
          .fill(StitchEcho),
      ...marginEnd
    ]);
  }
}

export class CablePatternFactory {
  factoryName: string = 'Cables';

  cableLengthInput: PatternFactoryInput;
  cableCountInput: PatternFactoryInput;
  rowsBetweenCablesInput: PatternFactoryInput;
  cableEdgeRowsInput: PatternFactoryInput;
  smoothingRowsInput: PatternFactoryInput;
  innerCablesInput: PatternFactoryInput;
  marginTypeInput: PatternFactoryInput;
  marginDistanceInput: PatternFactoryInput;


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
    this.marginTypeInput = new PatternFactoryInput(
        'Margin Type', 'Type of margin to use.', 'None', null,
        ['None', 'ICord', 'Knit']);
    this.marginDistanceInput = new PatternFactoryInput(
        'Margin Distance',
        'Number of purl stitches between the cable and its margin.', 2,
        'stitches');
  }

  getInputs(): PatternFactoryInput[] {
    return [
      this.cableLengthInput,
      this.cableCountInput,
      this.rowsBetweenCablesInput,
      this.cableEdgeRowsInput,
      this.smoothingRowsInput,
      this.innerCablesInput,
      this.marginTypeInput,
      this.marginDistanceInput,
    ];
  }

  build(): Pattern {
    const output = new Pattern();
    const marginType = this.marginTypeInput.value();
    const marginDistance =
        marginType == 'None' ? 0 : this.marginDistanceInput.numberValue();
    const layout = new CableLayout(
        this.cableCountInput.numberValue(),
        this.rowsBetweenCablesInput.numberValue(),
        this.cableEdgeRowsInput.numberValue(),
        this.smoothingRowsInput.numberValue(),
        this.innerCablesInput.value() == 'Enable', marginType as 'None' | 'ICord' | 'Knit', marginDistance);
    for (let row = 0; row < 2 * layout.rowsCount; row++)
      output.addRow(layout.computeRow(row));
    return output;
  }
}
