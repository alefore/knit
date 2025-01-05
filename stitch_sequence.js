class StitchSequence {
  constructor(sequence, repetitions) {
    this.sequence = sequence;
    this.repetitions = repetitions;
    if (isNaN(repetitions)) throw Error('Nan repetitions');
  }

  html() {
    if (this.repetitions == 0 || this.sequence === []) return '';
    const output = $(htmlTags.span, {class: 'stitchSequence'});
    const needParens = this.repetitions != 1 && this.sequence.length > 1;
    if (this.repetitions != 1 && needParens) output.append(this.repetitions);
    if (needParens) output.append('(');
    this.sequence.forEach(stitch => output.append(stitch.html()));
    if (needParens) output.append(')');
    if (this.repetitions != 1 && !needParens) output.append(this.repetitions);
    return output;
  }

  get inputStitches() {
    return this.repetitions *
        this.sequence.reduce(
            (total, stitch) => total + stitch.inputStitches, 0);
  }

  get outputStitches() {
    return this.repetitions *
        this.sequence.reduce(
            (total, stitch) => total + stitch.outputStitches, 0);
  }

  flatten(output = []) {
    for (let i = 0; i < this.repetitions; i++)
      this.sequence.forEach((stitch) => stitch.flatten(output));
    return output;
  }
}
