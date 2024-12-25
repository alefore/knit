class ScarfPatternFactory {
  static cubicBezierFocalPoints = {
    Balanced: [{x: 0.6, y: 0.3}, {x: 0.4, y: 0.7}],
    Thin: [{x: 0.75, y: 0.3}, {x: 0.5, y: 0.7}],
    Thick: [{x: 0.5, y: 0.3}, {x: 0.25, y: 0.7}],
    Straight: [{x: 0.5, y: 0.5}, {x: 0.5, y: 0.5}],
  };

  static textures = {'Garter': garterRow, 'Double moss': doubleMossStitchRow};

  static name = 'Sophie Scarf';

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
        'Texture', 'What type of texture do you want?',
        Object.keys(ScarfPatternFactory.textures)[0], null,
        Object.keys(ScarfPatternFactory.textures));
    this.shapeInput = new PatternFactoryInput(
        'Shape', 'What general shape would you like?',
        Object.keys(ScarfPatternFactory.cubicBezierFocalPoints)[0], null,
        Object.keys(ScarfPatternFactory.cubicBezierFocalPoints));
  }

  getInputs() {
    return [
      this.rowsInput, this.centerLengthInput, this.centerWidthInput,
      this.textureInput, this.shapeInput
    ];
  }

  build() {
    if (this.centerLengthInput.numberValue() > this.rowsInput.numberValue())
      throw new Error(`${this.centerLengthInput.name} (${
          this.centerLengthInput
              .numberValue()}) must smaller than or equal to ${
          this.rowsInput.name} (${this.rowsInput.numberValue()})`);

    const stitchesPerRow = this.#computeStitchesPerRow();
    const output = new Pattern();
    stitchesPerRow.forEach((value, index) => this.#addRow(output, value));
    for (let row = 0; row < this.centerLengthInput.numberValue(); row++)
      this.#addRow(output, this.centerWidthInput.numberValue());
    stitchesPerRow.reverse().forEach(
        (value, index) => this.#addRow(output, value));
    return output;
  }

  #computeStitchesPerRow() {
    const rowsPerSide = Math.floor(
        (this.rowsInput.numberValue() - this.centerLengthInput.numberValue()) /
        2);
    const coordinates =
        ScarfPatternFactory.cubicBezierFocalPoints[this.shapeInput.value()];
    const p0 = {x: 0, y: 0};
    const p1 = {
      x: coordinates[0].x * rowsPerSide,
      y: coordinates[0].y * this.centerWidthInput.numberValue()
    };
    const p2 = {
      x: coordinates[1].x * rowsPerSide,
      y: coordinates[1].y * this.centerWidthInput.numberValue()
    };
    const p3 = {x: rowsPerSide, y: this.centerWidthInput.numberValue()};
    return cubicBezierArray(rowsPerSide, p0, p1, p2, p3);
  }

  #addRow(pattern, desiredStitches) {
    const totalBorderStitches = this.borderStitches * 2;
    const previousStitches = pattern.isEmpty() ?
        0 :
        pattern.lastRow().countOutputStitches() - totalBorderStitches;
    const atEvenRow = pattern.rowsCount() % 2 == 0;

    let growType = null;
    if (atEvenRow && previousStitches < desiredStitches)
      growType = KnitFrontBack;
    else if (atEvenRow && previousStitches > desiredStitches)
      growType = KnitTwoTogether;
    pattern.addRow(
        ScarfPatternFactory
            .textures[this.textureInput.value()](
                pattern.rows.length,
                previousStitches - (growType === KnitTwoTogether ? 1 : 0))
            .borderWrap(growType));
  }
}

function row2x2(rowId, stitches) {
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
  return row2x2(rowId, stitches);
}

function garterRow(rowId, stitches) {
  return new Row([new StitchSequence([Knit], stitches)]);
}
