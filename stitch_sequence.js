class StitchSequence {
  constructor(sequence, repetitions) {
    this.sequence = sequence;
    this.repetitions = repetitions;
    if (isNaN(repetitions)) throw Error('Nan repetitions');
  }

  describe() {
    if (this.repetitions == 0 || this.sequence === []) return '';
    const output = $('<span>', {class: 'stitchSequence'});
    const needParens = this.repetitions != 1 && this.sequence.length > 1;
    if (this.repetitions != 1 && needParens) output.append(this.repetitions);
    if (needParens) output.append('(');
    output.append(this.sequence.map(stitch => stitch.html()).join(' '));
    if (needParens) output.append(')');
    if (this.repetitions != 1 && !needParens) output.append(this.repetitions);
    return output;
  }

  countInputStitches() {
    return this.repetitions *
        this.sequence.reduce((total, stitch) => total + stitch.inputs, 0);
  }

  countOutputStitches() {
    return this.repetitions *
        this.sequence.reduce((total, stitch) => total + stitch.outputs, 0);
  }
}
