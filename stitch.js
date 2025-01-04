class Stitch {
  constructor(inputStitches, outputStitches, representation, color, tooltip) {
    if (isNaN(inputStitches)) throw Error('Nan outputs');
    if (isNaN(outputStitches)) throw Error('Nan outputs');
    this.inputStitches = inputStitches;
    this.outputStitches = outputStitches;
    this.representation = representation;
    this.color = color;
    this.tooltip = tooltip;  // Store the tooltip text
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
const WithYarnInFront = new Stitch(0, 0, 'WYF', '#f4cae4', 'WithYarnInFront');
const WithYarnInBack = new Stitch(0, 0, 'WYB', '#f4cae4', 'WithYarnInBack');

// Cable stitches
// Order: slip count, [front, back], stitch count, [knit, purl]
const CableOneBackKnitTwo = new Stitch(
    2, 2, 'CBK2', '#f4cae4',
    'Slip 1 onto cable, hold in back, knit 2, return from cable to left needle');
const CableTwoFrontPurlOne = new Stitch(
    1, 1, 'C2FP', '#f4cae4',
    'Slip 2 onto cable, hold in front, purl 1, return from cable to left needle');
const CableTwoFrontKnitTwo = new Stitch(
    2, 2, 'C2FK2', '#f4cae4',
    'Slip 2 onto cable, hold in front, knit 2, return from cable to left needle');
const CableTwoFrontPurlTwo = new Stitch(
    2, 2, 'C2FP2', '#f4cae4',
    'Slip 2 onto cable, hold in front, purl 2, return from cable to left needle');
const CableTwoBackKnitTwo = new Stitch(
    2, 2, 'C2BK2', '#f4cae4',
    'Slip 2 onto cable, hold in back, knit 2, return from cable to left needle');

// Other stitches
const StitchEcho =
    new Stitch(1, 1, 'R', '#b3e2cd', 'Knit the knits and purl the purls');
