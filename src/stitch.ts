import { htmlTags } from './constants.js';

export class Stitch {
  public inputStitches: number;
  public outputStitches: number;
  public representation: string;
  public color: string;
  public tooltip: string;

  constructor(
    inputStitches: number,
    outputStitches: number,
    representation: string,
    color: string,
    tooltip: string
  ) {
    if (isNaN(inputStitches)) throw Error('Nan inputs');
    if (isNaN(outputStitches)) throw Error('Nan outputs');

    this.inputStitches = inputStitches;
    this.outputStitches = outputStitches;
    this.representation = representation;
    this.color = color;
    this.tooltip = tooltip;
  }

  /**
   * Generates a jQuery element for the stitch.
   */
  html(): JQuery<HTMLElement> {
    return $(htmlTags.span, {
      style: `color: ${this.color};`,
      title: this.tooltip,
      class: 'stitch'
    }).append(this.representation);
  }

  /**
   * Flattens the stitch into an array.
   */
  flatten(output: Stitch[] = []): Stitch[] {
    output.push(this);
    return output;
  }
}

// Stitch Definitions
export const Knit = new Stitch(1, 1, 'K', '#b3e2cd', 'Knit');
export const Purl = new Stitch(1, 1, 'P', '#fdcdac', 'Purl');
export const KnitFrontBack = new Stitch(1, 2, 'KFB', '#cbd5e8', 'KnitFrontBack');
export const SlipStitchPurlwise = new Stitch(1, 1, 'SLP', '#f4cae4', 'SpliStitchPurlwise');
export const KnitTwoTogether = new Stitch(2, 1, 'K2Tog', '#e6f5c9', 'KnitTwoTogether');
export const SlipSlipKnit = new Stitch(2, 1, 'SSK', '#e6f5c9', 'SlipSlipKnit');
export const WithYarnInFront = new Stitch(0, 0, 'WYF', '#f4cae4', 'WithYarnInFront');
export const WithYarnInBack = new Stitch(0, 0, 'WYB', '#f4cae4', 'WithYarnInBack');

export const M1L = new Stitch(0, 1, 'M1L', '#000', 'M1L');
export const M1R = new Stitch(0, 1, 'M1R', '#000', 'M1R');

// Cable stitches
export const CableOneBackKnitTwo = new Stitch(
  2, 2, 'CBK2', '#f4cae4',
  'Slip 1 onto cable, hold in back, knit 2, return from cable to left needle'
);
export const CableTwoFrontPurlOne = new Stitch(
  1, 1, 'C2FP', '#f4cae4',
  'Slip 2 onto cable, hold in front, purl 1, return from cable to left needle'
);
export const CableTwoFrontKnitTwo = new Stitch(
  2, 2, 'C2FK2', '#f4cae4',
  'Slip 2 onto cable, hold in front, knit 2, return from cable to left needle'
);
export const CableTwoFrontPurlTwo = new Stitch(
  2, 2, 'C2FP2', '#f4cae4',
  'Slip 2 onto cable, hold in front, purl 2, return from cable to left needle'
);
export const CableTwoBackKnitTwo = new Stitch(
  2, 2, 'C2BK2', '#f4cae4',
  'Slip 2 onto cable, hold in back, knit 2, return from cable to left needle'
);

// Other stitches
export const StitchEcho = new Stitch(1, 1, 'R', '#b3e2cd', 'Knit the knits and purl the purls');
