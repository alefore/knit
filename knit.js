class Stitch {
  constructor(inputs, outputs, representation, color, tooltip) {
    if (isNaN(outputs)) throw Error("Nan outputs");
    this.inputs = inputs;
    this.outputs = outputs;
    this.representation = representation;
    this.color = color;
    this.tooltip = tooltip; // Store the tooltip text
  }

  describe() {
    return `${this.representation} (Inputs: ${this.inputs}, Outputs: ${this.outputs})`;
  }

  html() {
    return `<span style="color: ${this.color};" title="${this.tooltip}">${this.representation}</span>`;
  }
}

const Knit = new Stitch(1, 1, 'K', '#b3e2cd', 'Knit');
const Purl = new Stitch(1, 1, 'P', '#fdcdac', 'Purl');
const KnitFrontBack = new Stitch(1, 2, 'KFB', '#cbd5e8', 'KnitFrontBack');
const SlipStitchPurlwise = new Stitch(1, 1, 'SLP', '#f4cae4', 'SpliStitchPurlwise');
const KnitTwoTogether = new Stitch(2, 1, 'K2Tog', '#e6f5c9', 'KnitTwoTogether');

class StitchSequence {
  constructor(sequence, repetitions) {
    this.sequence = sequence;
    this.repetitions = repetitions;
    if (isNaN(repetitions)) throw Error("Nan repetitions");
  }

  describe() {
    let sequenceDescription =
         this.sequence.map(stitch => stitch.html()).join(" ");
    if (this.repetitions == 0 || this.sequence === [])
      return '';
    if (this.repetitions == 1)
      return sequenceDescription;
    if (this.sequence.length > 1)
      sequenceDescription = '(' + sequenceDescription + ')';
    return this.repetitions + sequenceDescription;
  }

  countInputStitches() {
    return this.repetitions
        * this.sequence.reduce((total, stitch) => total + stitch.inputs, 0);
  }

  countOutputStitches() {
    return this.repetitions
        * this.sequence.reduce((total, stitch) => total + stitch.outputs, 0);
  }
}

class Row {
  constructor(stitchSequences = []) {
    this.stitchSequences = stitchSequences;
  }

  countInputStitches() {
    return this.stitchSequences.reduce(
        (total, sequence) => total + sequence.countInputStitches(), 0);
  }

  countOutputStitches() {
    return this.stitchSequences.reduce(
      (total, sequence) => total + sequence.countOutputStitches(), 0);
  }

  describeStitches() {
    return this.stitchSequences.map(sequence => { return sequence.describe(); })
        .join(" ");
  }

  createDiv(index, showDetails) {
    const stitchDelta = this.countOutputStitches() - this.countInputStitches();

    const rowDiv = document.createElement('div');
    const rowP = document.createElement('p');

    const indexSpan = document.createElement('span');
    indexSpan.classList.add('rowIndex');
    indexSpan.textContent = index + (index % 2 == 0 ? '↓' : '↑')
        + ' ('
        + this.countOutputStitches()
        + (stitchDelta == 0 ? '' : ' Δ' + stitchDelta) + ') ';

    rowP.appendChild(indexSpan);
    const htmlContainer = document.createElement('span');
    htmlContainer.innerHTML = this.describeStitches();

    rowP.appendChild(htmlContainer);

    rowDiv.appendChild(rowP);

    if (showDetails) {
      const detailsP = document.createElement('p');
      detailsP.classList.add('details');
      const previousStitches = pattern.slice(0, index).reduce(
          (total, r) => total + r.countOutputStitches(), 0);
      detailsP.textContent =
          Math.floor(100 * previousStitches / countTotalStitches()) + '%'
      rowDiv.appendChild(detailsP);
    }

    rowDiv.classList.add('row');
    return rowDiv;
  }
}

// Your pattern array
var pattern = [];

function countStitches() {
  if (pattern.length == 0) return 0;
  return pattern[pattern.length - 1].countOutputStitches() - 6;
}

function countTotalStitches() {
  return pattern.reduce(
      (total, row) => total + row.countOutputStitches(), 0);
}

function borderWrap(row) {
  return new Row([new StitchSequence([Knit], 3), ...row.stitchSequences,
                  new StitchSequence([SlipStitchPurlwise], 3)]);
}

function borderWrapAdjust(rowGenerator, growType) {
  let stitches = countStitches() + (growType.inputs == 2 ? -1 : 0);
  return new Row(
      [new StitchSequence([Knit], 2),
       new StitchSequence([growType], 1),
       ...rowGenerator(stitches).stitchSequences,
       new StitchSequence([SlipStitchPurlwise], 3)]);
}

function Row1x1(stitches, startKnit) {
  const finalStitch = new StitchSequence([startKnit ? Knit : Purl], 1);
  let output = [new StitchSequence(startKnit
                                       ? [Knit, Purl] : [Purl, Knit],
                                   Math.floor(stitches / 2))];
  if (stitches % 2 == 1) output.push(finalStitch);
  return new Row(output);
}

function rightSide() { return pattern.length % 2 == 0; }

function Row2x2(stitches) {
  const rowBottomKnit = (pattern.length + 1) % 4 < 2;
  const startKnit = rightSide() ? rowBottomKnit : !rowBottomKnit;
  let head = [new StitchSequence(
      rightSide() == rowBottomKnit
          ? [Purl, Purl, Knit, Knit] : [Knit, Knit, Purl, Purl],
      Math.floor(stitches / 4))];
  let tail = [];
  if (stitches % 4 >= 1)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 >= 2)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 == 3)
    tail.push(new StitchSequence([rowBottomKnit ? Purl : Knit], 1));
  return new Row(!rightSide()
                     ? [...head, ...tail] : [...tail.reverse(), ...head]);
}

function mossStitchRow(stitches) {
  return Row2x2(stitches);
}

function adjustAndGenerate(rows, adjust, adjustAtStart, rowGenerator) {
  const patternEmpty = pattern.length == 0;
  if (adjustAtStart && !patternEmpty)
    pattern.push(borderWrapAdjust(rowGenerator, adjust));
  const stitches = countStitches()
  for (let row = pattern.length == 0 || stitches == 0 ? 0 : 1;
       row < rows; ++row)
    pattern.push(borderWrap(rowGenerator(stitches)));
  if (!adjustAtStart && !patternEmpty && stitches > 0)
    pattern.push(borderWrapAdjust(rowGenerator, adjust));
}

// (45 / 183) * 412
// (50 / 200) * 412

var sizes = [16, 14, 14, 14, 14, 12, 12, 12, 12, 12, 10, 10, 8, 8, 10, 12, 16];
sizes.forEach((value, index) =>
              adjustAndGenerate(value, KnitFrontBack, true, mossStitchRow));
pattern.push(borderWrap(mossStitchRow(countStitches())));
sizes.reverse().forEach(
    (value, index) =>
    adjustAndGenerate(value, KnitTwoTogether, false, mossStitchRow));

// pattern.push('Bind off');

var currentRow = 0;

function selectRow(row) {
  currentRow = row;
  renderPattern();
  drawKnitPattern(pattern);
}

function renderPattern() {
  const container = document.getElementById('patternContainer');
  container.innerHTML = '';

  const currentDivContainer = document.getElementById('currentRow');
  currentDivContainer.innerHTML = '';

  let selectedRow = null;

  pattern.forEach((rowData, index) => {
    const divNormal = rowData.createDiv(index, false);
    container.appendChild(divNormal);
    divNormal.addEventListener('click', () => {
      selectRow(index);
    });
    if (index === currentRow) {
      divNormal.classList.add('highlight');
      currentDivContainer.appendChild(rowData.createDiv(index, true));
      selectedRow = divNormal;
    }
  });


      //const style = window.getComputedStyle(selectedRow);
      //const marginTop = parseInt(style.marginTop, 10);
  const rowTop = selectedRow.offsetTop; // - marginTop;
  const rowHeight = selectedRow.offsetHeight;

  const containerHeight = container.offsetHeight;
  const rowCenter = rowTop + (rowHeight / 2);
  scrollPosition = rowCenter - (containerHeight / 2);
  scrollPosition = Math.max(scrollPosition, 0);

  const maxScrollPosition = container.scrollHeight - container.offsetHeight;
  scrollPosition = Math.min(scrollPosition, maxScrollPosition);
  container.scrollTop = scrollPosition;
}

function addRow(delta) {
  if (delta > 0 && currentRow < pattern.length - 1) {
    selectRow(currentRow + 1);
  }
  if (delta < 0 && currentRow > 0) {
    selectRow(currentRow - 1);
  }
}

function invertColor(color) {
  if (color === 'black') return 'white';
  if (color === 'white') return 'black';
  return color;
}

function drawKnitPattern(rows) {
  const canvas = document.getElementById('knitCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = 150;

  const maxStitches = Math.max(...rows.map(row => row.countOutputStitches()));
  const numRows = rows.length;

  const stitchSizeWidth = canvas.width / numRows;
  const stitchSizeHeight = canvas.height / maxStitches;
  const stitchSize = Math.min(stitchSizeWidth, stitchSizeHeight);

  rows.forEach((row, rowIndex) => {
    let stitchIndex = 0;
    let rowOutputStitches = row.countOutputStitches();
    row.stitchSequences.forEach(stitchSequence => {
      for (let i = 0; i < stitchSequence.repetitions; i++) {
        stitchSequence.sequence.forEach(stitch => {
          if (rowIndex == currentRow)
            ctx.fillStyle = 'cyan'
          else
            ctx.fillStyle =
                rowIndex % 2 == 0 ? stitch.color : invertColor(stitch.color);
          for (let s = 0; s < stitch.outputs; s++) {
            const x = rowIndex * stitchSize;
            const y = stitchSize * (maxStitches -
                ((rowIndex % 2 == 0)
                    ? rowOutputStitches - stitchIndex : stitchIndex + 1));
            ctx.fillRect(x, y, stitchSize, stitchSize);
            stitchIndex++;
          }
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  selectRow(0);
});

document.body.addEventListener('keydown', function(e) {
  if (e.code === 'Space' || e.code === 'ArrowRight') {
    addRow(1);
    e.preventDefault();
  }
  if (e.code === 'ArrowLeft') {
    addRow(-1);
    e.preventDefault();
  }
});
