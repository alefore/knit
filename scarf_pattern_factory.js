class ScarfPatternFactory {
  constructor(borderStitches) {
    this.borderStitches = borderStitches;
    this.rowsInput = new PatternFactoryInput(
        'Total Length',
        'How long should the scarf measure from tip to top along its ' +
            'longest dimension?',
        412, 'rows');
    this.centerLengthInput = new PatternFactoryInput(
        'Center Length',
        'How many additional rows should the scarf have in the center part ' +
            '(between increases and decreases) along the long dimension?',
        0, 'rows');
    this.centerWidthInput = new PatternFactoryInput(
        'Center Width',
        'How many stitches should the scarf have in the center part, ' +
            'between the increases and decreases?' +
            ' Does not include the 6 stitches for the i-cord border.',
        25, 'stitches');
    this.textureInput = new PatternFactoryInput(
        'Texture', 'What type of texture do you want?', 'Garter', null,
        ['Double moss', 'Garter']);

    this.bezierFocalPointFunctions = {
      Thin: [{x: 0.75, y: 0.3}, {x: 0.5, y: 0.7}],
      Balanced: [{x: 0.6, y: 0.3}, {x: 0.4, y: 0.7}],
      Thick: [{x: 0.5, y: 0.3}, {x: 0.25, y: 0.7}],
      Straight: [{x: 0.5, y: 0.5}, {x: 0.5, y: 0.5}],
    };

    this.shapeInput = new PatternFactoryInput(
        'Shape', 'What general shape would you like?', 'Balanced', null,
        Object.keys(this.bezierFocalPointFunctions));
  }

  getInputs() {
    return [
      this.rowsInput, this.centerLengthInput, this.centerWidthInput,
      this.textureInput, this.shapeInput
    ];
  }

  bezier(t, p0, p1, p2, p3) {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;

    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;

    const x = ax * t * t * t + bx * t * t + cx * t + p0.x;
    const y = ay * t * t * t + by * t * t + cy * t + p0.y;

    return {x: x, y: y};
  }

  // Fills all indices of array in range [i, n). At index x, stores a valid
  // value for y at a value in [x, x+1).
  fillBezierArray(array, i, n, ti, tn, p0, p1, p2, p3) {
    const middle = (ti + tn) / 2;
    const newPoint = this.bezier(middle, p0, p1, p2, p3);
    const newIndex = Math.round(newPoint.x);
    array[Math.floor(newPoint.x)] = Math.round(newPoint.y);
    if (i < newIndex)
      this.fillBezierArray(array, newIndex, n, middle, tn, p0, p1, p2, p3);
    if (newIndex < n)
      this.fillBezierArray(array, i, newIndex, ti, middle, p0, p1, p2, p3);
  }

  rowsPerSide() {
    return Math.floor(
        (this.rowsInput.numberValue() - this.centerLengthInput.numberValue()) /
        2);
  }

  build() {
    if (this.centerLengthInput.numberValue() > this.rowsInput.numberValue())
      throw new Error(
          this.centerLengthInput.name + ' must smaller than or equal to ' +
          this.rowsInput.name);

    const output = new Pattern();
    const stitches = Array(this.rowsPerSide()).fill(null);
    const coordinates = this.bezierFocalPointFunctions[this.shapeInput.value()];
    const p0 = {x: 0, y: 0};
    const p1 = {
      x: coordinates[0].x * this.rowsPerSide(),
      y: coordinates[0].y * this.centerWidthInput.numberValue()
    };
    const p2 = {
      x: coordinates[1].x * this.rowsPerSide(),
      y: coordinates[1].y * this.centerWidthInput.numberValue()
    };
    const p3 = {x: this.rowsPerSide(), y: this.centerWidthInput.numberValue()};
    this.fillBezierArray(stitches, 0, this.rowsPerSide(), 0, 1, p0, p1, p2, p3);
    stitches.forEach((value, index) => this.addRow(output, value));
    for (let row = 0; row < this.centerLengthInput.numberValue(); row++)
      this.addRow(output, this.centerWidthInput.numberValue());
    stitches.reverse().forEach((value, index) => this.addRow(output, value));
    return output;
  }

  addRow(pattern, desiredStitches) {
    const totalBorderStitches = this.borderStitches * 2;
    const previousStitches = pattern.isEmpty() ?
        0 :
        pattern.lastRow().countOutputStitches() - totalBorderStitches;
    const atEvenRow = pattern.rowsCount() % 2 == 0;
    const rowGenerator =
        this.textureInput.value() == 'Garter' ? garterRow : doubleMossStitchRow;

    let growType = null;
    if (atEvenRow && previousStitches < desiredStitches)
      growType = KnitFrontBack;
    else if (atEvenRow && previousStitches > desiredStitches)
      growType = KnitTwoTogether;
    pattern.addRow(
        rowGenerator(
            pattern.rows.length,
            previousStitches - (growType === KnitTwoTogether ? 1 : 0))
            .borderWrap(growType));
  }
}

function Row2x2(rowId, stitches) {
  const rightSide = rowId % 2 == 0;
  const rowBottomKnit = (rowId + 1) % 4 < 2;
  let head = [new StitchSequence(
      rightSide != rowBottomKnit ? [Knit, Knit, Purl, Purl] :
                                   [Purl, Purl, Knit, Knit],
      Math.floor(stitches / 4))];
  let tail = [];
  if (stitches % 4 >= 1)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 >= 2)
    tail.push(new StitchSequence([rowBottomKnit ? Knit : Purl], 1));
  if (stitches % 4 == 3)
    tail.push(new StitchSequence([rowBottomKnit ? Purl : Knit], 1));
  return new Row(
      !rightSide ? [...head, ...tail] : [...tail.reverse(), ...head]);
}

function doubleMossStitchRow(rowId, stitches) {
  return Row2x2(rowId, stitches);
}

function garterRow(rowId, stitches) {
  return new Row([new StitchSequence([Knit], stitches)]);
}
