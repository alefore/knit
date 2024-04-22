class Stitch {
  constructor(inputs, outputs, representation, color, tooltip) {
    if (isNaN(outputs)) throw Error('Nan outputs');
    this.inputs = inputs;
    this.outputs = outputs;
    this.representation = representation;
    this.color = color;
    this.tooltip = tooltip;  // Store the tooltip text
  }

  describe() {
    return `${this.representation} (Inputs: ${this.inputs}, Outputs: ${
        this.outputs})`;
  }

  html() {
    return `<span style="color: ${this.color};" title="${this.tooltip}">${
        this.representation}</span>`;
  }
}

const Knit = new Stitch(1, 1, 'K', '#b3e2cd', 'Knit');
const Purl = new Stitch(1, 1, 'P', '#fdcdac', 'Purl');
const KnitFrontBack = new Stitch(1, 2, 'KFB', '#cbd5e8', 'KnitFrontBack');
const SlipStitchPurlwise =
    new Stitch(1, 1, 'SLP', '#f4cae4', 'SpliStitchPurlwise');
const KnitTwoTogether = new Stitch(2, 1, 'K2Tog', '#e6f5c9', 'KnitTwoTogether');
