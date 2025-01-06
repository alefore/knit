class CapeletPatternFactory {
  static name = 'Capelet';

  constructor() {
    this.borderLengthInput = new PatternFactoryInput(
        'Length: Border', 'Width of the border (under the base).', 3, 'rows');
    this.baseWidthInput = new PatternFactoryInput(
        'Width: Base', 'Width of the capelet be at the base.', 120, 'stitches');
    this.shoulderWidthInput = new PatternFactoryInput(
        'Width: Shoulder',
        'Width of the capelet be at the center, on top of the shoulders.', 100,
        'stitches');
    this.neckWidthInput = new PatternFactoryInput(
        'Width: Neck', 'Width of the capelet be at the base of the neck.', 60,
        'stitches');
    this.baseToShoulderLengthInput = new PatternFactoryInput(
        'Length: Base to shoulder',
        'Distance in rows from the base to the shoulder.', 50, 'rows');
    this.shoulderToNeckLengthInput = new PatternFactoryInput(
        'Length: Shoulder to neck',
        'Distance in rows from the shoulder to the base of the neck.', 50,
        'rows');
    this.neckLengthInput = new PatternFactoryInput(
        'Length: Neck', 'Length of the neck.', 20, 'rows');
    this.cableInput = new PatternFactoryInput(
        'Capelet Cable', 'Should we add a cable in the front?', 'Disable', null,
        ['Disable', 'Enable']);
  }

  getInputs() {
    return [
      this.borderLengthInput,
      this.baseWidthInput,
      this.shoulderWidthInput,
      this.neckWidthInput,
      this.baseToShoulderLengthInput,
      this.shoulderToNeckLengthInput,
      this.neckLengthInput,
      this.cableInput,
    ];
  }

  build() {
    const pattern = new Pattern().setRound();
    const cable = this.cableInput.value() == 'Enable' ?
        new CableLayout(4, 4, 4, 2, true, 'Knit', 4) :
        null;

    this.#addBorder(this.baseWidthInput.numberValue(), pattern);
    this.#buildPart(
        pattern, 'Base', this.baseWidthInput.numberValue(),
        this.shoulderWidthInput.numberValue(),
        this.baseToShoulderLengthInput.numberValue(), cable);
    this.#buildPart(
        pattern, 'Shoulder', this.shoulderWidthInput.numberValue(),
        this.neckWidthInput.numberValue(),
        this.shoulderToNeckLengthInput.numberValue(), cable);
    this.#buildPart(
        pattern, 'Neck', this.neckWidthInput.numberValue(),
        this.neckWidthInput.numberValue(), this.neckLengthInput.numberValue());
    this.#addBorder(pattern.lastRow().outputStitches, pattern);
    return pattern;
  }

  #addBorder(width, outputPattern) {
    for (let row = 0; row < this.borderLengthInput.numberValue(); row++)
      outputPattern.addRow(new Row([new StitchSequence([Purl], width)]));
  }

  #buildPart(pattern, partName, startWidth, endWidth, length, cable) {
    if (startWidth % 2 != 0) throw new Error('Width must be even.');
    if (endWidth % 2 != 0) throw new Error('Width must be even.');
    if (endWidth > startWidth)
      throw new Error('Invalid width (growing instead of shrinking).');
    if (cable != null && cable.rowsWidth % 2 != 0)
      throw new Error(`Cable width is odd: ${cable.rowsWidth}`);
    for (let row = 0; row < length; row++) {
      const currentHalfWidth = pattern.isEmpty() ?
          startWidth / 2 :
          pattern.lastRow().outputStitches / 2;
      console.log(currentHalfWidth);
      const desiredHalfWidth = startWidth / 2 -
          Math.round((startWidth - endWidth) * (row / length) / 2);
      const cableRow = cable == null ?
          null :
          cable.computeRow(pattern.rowsCount() % cable.rowsCount, 'None', 0);
      const rowOutput = [];
      if (desiredHalfWidth + 2 <= currentHalfWidth)
        for (let i = 0; i < 2; i++) {
          rowOutput.push(Knit);
          rowOutput.push(KnitTwoTogether);
          this.#maybeAddCableRow(
              partName, currentHalfWidth - 6, i == 0 ? cableRow : null,
              rowOutput);
          rowOutput.push(SlipSlipKnit);
          rowOutput.push(Knit);
        }
      else {
        this.#maybeAddCableRow(partName, currentHalfWidth, cableRow, rowOutput);
        rowOutput.push(new StitchSequence([Knit], currentHalfWidth));
      }
      pattern.addRow(new Row(rowOutput));
    }
  }

  #maybeAddCableRow(partName, outputStitches, cableRow, rowOutput) {
    if (outputStitches % 2 == 1)
      throw new Error(
          `${partName}: Invalid row output stitches (expected even): ${
              outputStitches}`);
    if (cableRow == null || cableRow.outputStitches > outputStitches) {
      rowOutput.push(new StitchSequence([Knit], outputStitches));
      return;
    }
    if (cableRow.outputStitches % 2 == 1)
      throw new Error('Invalid cable row output size (expected even).');
    const padding = new StitchSequence(
        [Knit], (outputStitches - cableRow.outputStitches) / 2);
    rowOutput.push(padding);
    rowOutput.push(new StitchSequence(cableRow.stitches, 1));
    rowOutput.push(padding);
  }
}
