import { htmlTags } from './constants.js';
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
  html(): HTMLElement | string {
    if (this.repetitions === 0) return '';

    const output = document.createElement(htmlTags.span);
    output.classList.add('stitchSequence');
    const needParens = this.repetitions !== 1 && this.sequence.length > 1;

    // Prefix repetition for multiple stitches: e.g., 2(K, P)
    if (this.repetitions !== 1 && needParens) {
      output.textContent = this.repetitions.toString();
    }

    if (needParens) output.textContent += '(';

    this.sequence.forEach((stitch) => {
      const stitchHtml = stitch.html();
      if (typeof stitchHtml === 'string') {
        output.insertAdjacentHTML('beforeend', stitchHtml);
      } else {
        output.appendChild(stitchHtml);
      }
      const zeroWidthSpace = '&#8203;';
      output.insertAdjacentHTML('beforeend', zeroWidthSpace);
    });

    if (needParens) output.textContent += ')';

    // Suffix repetition for single stitches: e.g., K2
    if (this.repetitions !== 1 && !needParens) {
      output.textContent += this.repetitions.toString();
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
