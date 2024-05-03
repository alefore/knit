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
    const zeroWidthSpace = '&#8203;';
    return intersperse(
        this.stitchSequences.map(sequence => {
          return sequence.describe();
        }),
        zeroWidthSpace);
  }

  createDiv(index, showDetails, pattern) {
    const stitchDelta = this.countOutputStitches() - this.countInputStitches();

    const rowDiv =
        $('<div>')
            .attr('class', showDetails ? 'highlight row' : 'row')
            .append(
                $('<p>')
                    .append(
                        $('<span>')
                            .attr('class', 'rowIndex')
                            .append(
                                index + (index % 2 == 0 ? '↓' : '↑') + ' (' +
                                this.countOutputStitches() +
                                (stitchDelta == 0 ? '' : ' Δ' + stitchDelta) +
                                ') '))
                    .append(this.describeStitches()));

    if (showDetails) {
      const previousStitches = pattern.rows.slice(0, index).reduce(
          (total, r) => total + r.countOutputStitches(), 0);
      const totalStitches = pattern.countTotalStitches();
      rowDiv.append($('<p>')
                        .attr('class', 'details')
                        .append(
                            Math.floor(100 * previousStitches / totalStitches) +
                            '% (' + previousStitches + ' of ' + totalStitches +
                            ' st)'));
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

function intersperse(array, value) {
  return array.reduce((acc, elem, index) => {
    if (index !== array.length - 1) {
      acc.push(elem, value);
    } else {
      acc.push(elem);
    }
    return acc;
  }, []);
}
