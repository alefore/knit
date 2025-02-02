class Row {
  constructor(stitches = []) {
    this.stitches = stitches;
  }

  get inputStitches() {
    return this.stitches.reduce(
        (total, sequence) => total + sequence.inputStitches, 0);
  }

  get outputStitches() {
    return this.stitches.reduce(
        (total, sequence) => total + sequence.outputStitches, 0);
  }

  flatten(output = []) {
    this.stitches.forEach((sequence) => sequence.flatten(output));
    return output;
  }

  describeStitches() {
    const zeroWidthSpace = '&#8203;';
    return intersperse(
        this.stitches.map(sequence => {
          return sequence.html();
        }),
        zeroWidthSpace);
  }

  createDiv(index, showDetails, pattern) {
    const stitchDelta = this.outputStitches - this.inputStitches;

    const rowDiv =
        $(htmlTags.div, {class: showDetails ? 'highlight row' : 'row'})
            .append(
                $(htmlTags.p)
                    .append(
                        $(htmlTags.span, {class: 'rowIndex'})
                            .append(
                                index +
                                (pattern.showRowDirection ?
                                     (index % 2 == 0 ? '↓ ' : '↑ ') :
                                     '') +
                                '(' + this.outputStitches +
                                (stitchDelta == 0 ? '' : ' Δ' + stitchDelta) +
                                ') '))
                    .append(this.describeStitches()));

    if (showDetails) {
      const previousStitches = pattern.rows.slice(0, index).reduce(
          (total, r) => total + r.outputStitches, 0);
      const totalStitches = pattern.outputStitches;
      rowDiv.append($(htmlTags.p, {class: 'details'})
                        .append(
                            Math.floor(100 * previousStitches / totalStitches) +
                            '% (' + previousStitches + ' of ' + totalStitches +
                            ' st)'));
    }

    return rowDiv;
  }

  borderWrap(growType) {
    const prefix = growType === null ?
        [new StitchSequence([Knit], 3)] :
        [new StitchSequence([Knit], 2), new StitchSequence([growType], 1)];
    return new Row([
      ...prefix, ...this.stitches, new StitchSequence([WithYarnInFront], 1),
      new StitchSequence([SlipStitchPurlwise], 3)
    ]);
  }
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
