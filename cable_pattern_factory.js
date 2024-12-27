class CablePatternFactory {
  static name = 'Cables';

  constructor() {
    this.cableLengthInput = new PatternFactoryInput(
        'Cable Length', 'How long should the pattern be?', 1,
        'cable pattern rows');
  }

  getInputs() {
    return [
      this.cableLengthInput,
    ];
  }

  build() {
    const output = new Pattern();
    const evenRow = new Row([
      new StitchSequence([WithYarnInFront, SlipStitchPurlwise], 1),
      new StitchSequence([StitchEcho], 23)
    ]);
    for (let i = 0; i < this.cableLengthInput.numberValue(); i++) {
      // Row 1
      output.addRow(new Row([
        new StitchSequence(
            [WithYarnInBack, SlipStitchPurlwise, Purl, CableTwoBackKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [Purl, Purl, Purl, Purl, CableTwoBackKnitTwo, Knit, Knit], 2),
        new StitchSequence([Purl], 2)
      ]));
      output.addRow(evenRow);
      // Row 3
      output.addRow(new Row([
        new StitchSequence(
            [WithYarnInBack, SlipStitchPurlwise, CableOneBackKnitTwo, Purl], 1),
        new StitchSequence(
            [CableTwoFrontPurlTwo, Knit, Knit, CableTwoBackKnitTwo, Purl, Purl],
            2),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 1),
      ]));
      output.addRow(evenRow);
      // Row 5
      output.addRow(new Row([
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 7
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableOneBackKnitTwo, Purl], 1),
        new StitchSequence([CableTwoFrontPurlTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([CableTwoBackKnitTwo], 1),
        new StitchSequence([Purl], 2),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 9
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoBackKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 11:
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise, Knit], 1),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [CableTwoBackKnitTwo, Purl, Purl, CableTwoFrontPurlTwo, Knit, Knit],
            1),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 4),
        new StitchSequence([Knit], 2),
      ]));
      output.addRow(evenRow);
      // Row 13
      output.addRow(new Row([
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 4),
        new StitchSequence([CableTwoFrontKnitTwo], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence([Purl], 3),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 1),
      ]));
      output.addRow(evenRow);
      // Row 15
      output.addRow(new Row([
        new StitchSequence([WithYarnInBack, SlipStitchPurlwise], 1),
        new StitchSequence([CableTwoFrontPurlOne], 1),
        new StitchSequence([Knit], 2),
        new StitchSequence(
            [CableTwoBackKnitTwo, Purl, Purl, CableTwoFrontPurlTwo, Knit, Knit],
            2),
        new StitchSequence([CableOneBackKnitTwo], 1),
        new StitchSequence([Purl], 2),
      ]));
      output.addRow(evenRow);
    }
    return output;
  }
}