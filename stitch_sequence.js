class StitchSequence {
  constructor(sequence, repetitions) {
    this.sequence = sequence;
    this.repetitions = repetitions;
    if (isNaN(repetitions)) throw Error("Nan repetitions");
  }

  describe() {
    let sequenceDescription =
         this.sequence.map(stitch => stitch.html()).join(" ");
    if (this.repetitions == 0 || this.sequence === [])
      return '';
    if (this.repetitions == 1)
      return sequenceDescription;
    if (this.sequence.length > 1)
      sequenceDescription = '(' + sequenceDescription + ')';
    return this.repetitions + sequenceDescription;
  }

  countInputStitches() {
    return this.repetitions
        * this.sequence.reduce((total, stitch) => total + stitch.inputs, 0);
  }

  countOutputStitches() {
    return this.repetitions
        * this.sequence.reduce((total, stitch) => total + stitch.outputs, 0);
  }
}
