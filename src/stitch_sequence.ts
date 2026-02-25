import { htmlTags, ZERO_WIDTH_SPACE_HTML_ENTITY } from './constants.js';
import { Stitch } from './stitch.js';

export class StitchSequence {
  public sequence: Stitch[];
  public repetitions: number;

  constructor(sequence: Stitch[], repetitions: number) {
    if (isNaN(repetitions)) throw new Error('Nan repetitions');
    this.sequence = sequence;
    this.repetitions = repetitions;
  }

  /**
   * Generates the HTML representation of the stitch sequence.
   */
  html(): HTMLElement {
    if (this.repetitions === 0) return document.createElement(htmlTags.span);

    const output = document.createElement(htmlTags.span);
    output.classList.add('stitchSequence');
    const needParens = this.repetitions !== 1 && this.sequence.length > 1;

    const OPEN_PAREN = '(';
    const CLOSE_PAREN = ')';
    const repetitionsText = this.repetitions.toString();

    // Prefix repetition for multiple stitches: e.g., 2(K, P)
    if (this.repetitions !== 1 && needParens) {
      const repSpan = document.createElement(htmlTags.span);
      repSpan.textContent = repetitionsText;
      output.appendChild(repSpan);
    }

    if (needParens) {
      const parenSpan = document.createElement(htmlTags.span);
      parenSpan.textContent = OPEN_PAREN;
      output.appendChild(parenSpan);
    }

    this.sequence.forEach((stitch) => {
      const stitchHtml = stitch.html();
      output.appendChild(stitchHtml);
      const zeroWidthSpace = document.createElement(htmlTags.span);
      zeroWidthSpace.innerHTML = ZERO_WIDTH_SPACE_HTML_ENTITY;
      output.appendChild(zeroWidthSpace);
    });

    if (needParens) {
      const parenSpan = document.createElement(htmlTags.span);
      parenSpan.textContent = CLOSE_PAREN;
      output.appendChild(parenSpan);
    }

    // Suffix repetition for single stitches: e.g., K2
    if (this.repetitions !== 1 && !needParens) {
      const repSpan = document.createElement(htmlTags.span);
      repSpan.textContent = repetitionsText;
      output.appendChild(repSpan);
    }

    return output;
  }

  /**
   * Total input stitches required.
   */
  get inputStitches(): number {
    return (
      this.repetitions *
      this.sequence.reduce((total, stitch) => total + stitch.inputStitches, 0)
    );
  }

  /**
   * Total output stitches resulting from the sequence.
   */
  get outputStitches(): number {
    return (
      this.repetitions *
      this.sequence.reduce((total, stitch) => total + stitch.outputStitches, 0)
    );
  }

  /**
   * Flattens the nested sequence into a flat array of Stitch instances.
   */
  flatten(output: Stitch[] = []): Stitch[] {
    for (let i = 0; i < this.repetitions; i++) {
      this.sequence.forEach((stitch) => stitch.flatten(output));
    }
    return output;
  }
}
