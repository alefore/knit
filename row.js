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
    return this.stitchSequences
        .map(sequence => {
          return sequence.describe();
        })
        .join(' ');
  }

  createDiv(index, showDetails, pattern) {
    const stitchDelta = this.countOutputStitches() - this.countInputStitches();

    const rowDiv =
        $('<div>').attr('class', showDetails ? 'highlight row' : 'row');

    const rowP = $('<p>').get(0);

    const indexSpan = document.createElement('span');
    indexSpan.classList.add('rowIndex');
    indexSpan.textContent = index + (index % 2 == 0 ? '↓' : '↑') + ' (' +
        this.countOutputStitches() +
        (stitchDelta == 0 ? '' : ' Δ' + stitchDelta) + ') ';

    rowP.appendChild(indexSpan);
    const htmlContainer = document.createElement('span');
    htmlContainer.innerHTML = this.describeStitches();

    rowP.appendChild(htmlContainer);

    rowDiv.append(rowP);

    if (showDetails) {
      const detailsP = document.createElement('p');
      detailsP.classList.add('details');
      const previousStitches = pattern.rows.slice(0, index).reduce(
          (total, r) => total + r.countOutputStitches(), 0);
      detailsP.textContent =
          Math.floor(100 * previousStitches / pattern.countTotalStitches()) +
          '%'
      rowDiv.append(detailsP);
    }

    return rowDiv;
  }

  borderWrap() {
    return new Row([
      new StitchSequence([Knit], 3), ...this.stitchSequences,
      new StitchSequence([WithYarnInFront], 1),
      new StitchSequence([SlipStitchPurlwise], 3)
    ]);
  }
}

function borderWrapAdjust(rowWithoutBorder, growType) {
  return new Row([
    new StitchSequence([Knit], 2), new StitchSequence([growType], 1),
    ...rowWithoutBorder.stitchSequences,
    new StitchSequence([WithYarnInFront], 1),
    new StitchSequence([SlipStitchPurlwise], 3)
  ]);
}
