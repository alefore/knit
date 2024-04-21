class ScarfPatternFactory {
  constructor(borderStitches, rowGenerator, sizes) {
    this.borderStitches = borderStitches;
    this.rowGenerator = rowGenerator;
    this.sizes = sizes;

    this.rowsInput =
        new PatternFactoryInput(
            'Rows',
            'How long should the scarf measure from tip to top along its '
            + 'longest dimension?',
            412,
            'rows')
    this.centerRowsInput =
        new PatternFactoryInput(
            'Center Rows',
            'How many rows should the scarf measure in the center part, '
            + 'between the increases and decreases?',
            16,
            'rows');
  }

  getInputs() {
    return [this.rowsInput, this.centerRowsInput];
  }

  build() {
    let output = new Pattern();
    this.sizes.forEach((value, index) =>
              this.adjustAndGenerate(output, value, KnitFrontBack, true));
    this.addRowWithBorder(output, null);
    this.sizes.reverse().forEach(
        (value, index) =>
        this.adjustAndGenerate(output, value, KnitTwoTogether, false));
    return output;
  }

  addRowWithBorder(pattern, adjust) {
    const totalBorderStitches = this.borderStitches * 2;
    const stitches =
        pattern.isEmpty()
            ? 0
            : pattern.lastRow().countOutputStitches() - totalBorderStitches
              + (adjust != null && adjust.inputs == 2 ? -1 : 0);
    const rowWithoutBorder = this.rowGenerator(pattern.rows.length, stitches);
    pattern.addRow(
        adjust == null
            ? rowWithoutBorder.borderWrap()
            : borderWrapAdjust(rowWithoutBorder, adjust));
  }

  adjustAndGenerate(pattern, rowsCount, adjust, adjustAtStart) {
    if (adjustAtStart)
      this.addRowWithBorder(pattern, pattern.isEmpty() ? null : adjust);
    const totalBorderStitches = this.borderStitches * 2;
    const stitches = pattern.isEmpty()
        ? 0
        : pattern.lastRow().countOutputStitches() - totalBorderStitches;
    for (let row = 0; row < rowsCount - 1; ++row)
      this.addRowWithBorder(pattern, null);
    if (!adjustAtStart)
      this.addRowWithBorder(pattern, adjust);
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

