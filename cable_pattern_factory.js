class CablePatternFactory {
  static name = 'Cables';

  constructor() {
    this.rowsInput = new PatternFactoryInput(
        'Cable Length', 'How long should the pattern be?', 1,
        'cable pattern rows');
    this.widthInput = new PatternFactoryInput(
        'Cable Width',
        'How many times should the basic cable pattern be repeated per row?', 1,
        'repeats per row');
  }

  getInputs() {
    return [
      this.rowsInput,
      this.widthInput,
    ];
  }

  build() {
    const output = new Pattern();
    for (let row = 0; row < this.rowsInput.numberValue(); row++)
      output.addRow(garterRow(row, this.widthInput.numberValue() * 16));
    return output;
  }
}
