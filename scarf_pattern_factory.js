class ScarfPatternFactory {
  constructor(borderStitches, rowGenerator, sizes) {
    this.borderStitches = borderStitches;
    this.rowGenerator = rowGenerator;
    this.sizes = sizes;
    this.rowsInput =
        new PatternFactoryInput(
            'Total Length',
            'How long should the scarf measure from tip to top along its '
            + 'longest dimension?',
            412,
            'rows')
    this.centerLengthInput =
        new PatternFactoryInput(
            'Center Length',
            'How many rows should the scarf have in the center part '
            + '(between increases and decreases) along the long dimension?',
            50,
            'rows');
    this.centerWidthInput =
        new PatternFactoryInput(
            'Center Stitches',
            'How many stitches should the scarf have in the center part, '
            + 'between the increases and decreases?'
            + ' Does not include the 6 stitches for the i-cord border.',
            25,
            'stitches');
  }

  getInputs() {
    return [this.rowsInput, this.centerLengthInput, this.centerWidthInput];
  }

  stitchesForRow(row) {
    const normalizedRow = row / this.rowsPerSide();
    const skipStart = 0.2;  // Otherwise the very start is waaay too long.
    return this.centerWidthInput.value()
          * (1 - Math.cos((skipStart + normalizedRow * (1 - skipStart)) * Math.PI)) ** 2 / 4;
  }

  rowsPerSide() {
    return (this.rowsInput.value() - this.centerLengthInput.value()) / 2;
  }

  build() {
    const output = new Pattern();
    const stitches = [];
    for (let row = 0; row < this.rowsPerSide(); row++)
      stitches.push(Math.floor(this.stitchesForRow(row)));
    stitches.forEach((value, index) => this.addRow(output, value));
    for (let row = 0; row < this.centerLengthInput.value(); row++)
      this.addRow(output, this.centerWidthInput.value());
    stitches.reverse().forEach((value, index) => this.addRow(output, value));
    return output;
  }

  addRow(pattern, desiredStitches) {
    const totalBorderStitches = this.borderStitches * 2;
    const previousStitches =
        pattern.isEmpty()
            ? 0
            : pattern.lastRow().countOutputStitches() - totalBorderStitches;
    if (previousStitches < desiredStitches)
      pattern.addRow(
          borderWrapAdjust(
              this.rowGenerator(pattern.rows.length, previousStitches),
              KnitFrontBack));
    else if (previousStitches > desiredStitches)
      pattern.addRow(
          borderWrapAdjust(
              this.rowGenerator(pattern.rows.length, previousStitches - 1),
              KnitTwoTogether));
    else
      pattern.addRow(
          this.rowGenerator(pattern.rows.length, previousStitches)
              .borderWrap());
  }
}

/*
function Row1x1(pattern, stitches, startKnit) {
  const finalStitch = new StitchSequence([startKnit ? Knit : Purl], 1);
  let output = [new StitchSequence(startKnit
                                       ? [Knit, Purl] : [Purl, Knit],
                                   Math.floor(stitches / 2))];
  if (stitches % 2 == 1) output.push(finalStitch);
  return new Row(output);
}
*/

function rightSide(rowId) { return rowId % 2 == 0; }

function Row2x2(rowId, stitches) {
  const rowBottomKnit = (rowId + 1) % 4 < 2;
  let head = [new StitchSequence(
      rightSide(rowId) != rowBottomKnit
          ? [Knit, Knit, Purl, Purl]
          : [Purl, Purl, Knit, Knit],
      Math.floor(stitches / 4))];
  let tail = [];
  if (stitches % 4 >= 1)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 >= 2)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 == 3)
    tail.push(new StitchSequence([rowBottomKnit ? Purl : Knit], 1));
  return new Row(!rightSide(rowId)
                     ? [...head, ...tail] : [...tail.reverse(), ...head]);
}

function mossStitchRow(rowId, stitches) {
  return Row2x2(rowId, stitches);
}

