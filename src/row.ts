import { htmlTags } from './constants.js';
import { Knit, SlipStitchPurlwise, WithYarnInFront, Stitch } from './stitch.js';
import { StitchSequence } from './stitch_sequence.js';
import { createTimestampView } from './timestamps.js';

/**
 * Minimal interface for the Pattern object used in createDiv
 * TODO: Remove, just depend on Pattern directly.
 */
interface IPattern {
  showRowDirection: boolean;
  rows: Row[];
  outputStitches: number;
}

function optimizeStitches(input: Stitch[]): StitchSequence[] {
  const n = input.length;
  // The best list of StitchSequence for input[i...n]:
  const bestFound = new Map<number, { sequence: StitchSequence[], cost: number}>();
  function solve(start:number): { sequence: StitchSequence[], cost:number } {
    if (start >= n) return {sequence:[], cost:0};
    if (bestFound.has(start)) return bestFound.get(start)!;
    let best = {sequence: [] as StitchSequence[], cost: Infinity };

    // Cap the length of the nested sequences; when they become very long, they are harder to read.
    const maxPatternLen = 8;
    for (let len=1; start + len <= n && len <= maxPatternLen; len++) {
      const pattern = input.slice(start, start + len);
      // How many times `pattern` repeats:
      for (let repetitions = 1; start + repetitions * len <= n; repetitions++) {
        if (repetitions > 1) {
          const nextBlock = input.slice(start + (repetitions - 1) * len, start + repetitions * len);
          if (!nextBlock.every((s, i) => s === pattern[i])) break;
        }
        const remaining = solve(start + repetitions * len);
        const currentCost = len + remaining.cost + (repetitions == 1 ? 0 : 0.99);
        if (currentCost < best.cost)
          best = { sequence: [new StitchSequence(pattern, repetitions), ...remaining.sequence],
                   cost: currentCost };
      }
    }
    bestFound.set(start, best);
    return best;
  }
  return solve(0).sequence;
}

export class Row {
  public stitches: StitchSequence[];
  public firstVisit: Date | null;

  constructor(stitches: StitchSequence[] = []) {
    const flatStitches : Stitch[] = [];
    stitches.forEach((sequence) => sequence.flatten(flatStitches));
    this.stitches = optimizeStitches(flatStitches);
    this.firstVisit = null;
  }

  get inputStitches(): number {
    return this.stitches.reduce(
      (total, sequence) => total + sequence.inputStitches, 0);
  }

  get outputStitches(): number {
    return this.stitches.reduce(
      (total, sequence) => total + sequence.outputStitches, 0);
  }

  /**
   * Flattens all sequences in the row into a flat array of Stitch objects.
   */
  flatten(output: Stitch[] = []): Stitch[] {
    this.stitches.forEach((sequence) => sequence.flatten(output));
    return output;
  }

  /**
   * Returns an array of HTML elements/strings separated by zero-width spaces.
   */
  describeStitches(): (JQuery<HTMLElement> | string)[] {
    const zeroWidthSpace = '&#8203;';
    return intersperse(
      this.stitches.map(sequence => sequence.html()),
      zeroWidthSpace
    );
  }

  /**
   * Creates the visual representation of the row.
   */
  createDiv(index: number, showDetails: boolean, pattern: IPattern): JQuery<HTMLElement> {
    const stitchDelta = this.outputStitches - this.inputStitches;

    const rowDiv = $(htmlTags.div, { class: showDetails ? 'highlight row' : 'row' })
      .append(
        $(htmlTags.p)
          .append(
            $(htmlTags.span, { class: 'rowIndex' })
              .append(
                index +
                (pattern.showRowDirection ?
                  (index % 2 === 0 ? '↓ ' : '↑ ') :
                  '') +
                '(' + this.outputStitches +
                (stitchDelta === 0 ? '' : ' Δ' + stitchDelta) +
                ') '
              )
          )
          .append(...this.describeStitches())
      );

    if (showDetails) {
      if (this.firstVisit === null) {
        this.firstVisit = new Date();
      }

      const previousStitches = pattern.rows.slice(0, index).reduce(
        (total, r) => total + r.outputStitches, 0);
      const totalStitches = pattern.outputStitches;

      rowDiv.append($(htmlTags.p, { class: 'details' })
        .append(
          Math.floor(100 * previousStitches / totalStitches) +
          '% (' + previousStitches + ' of ' + totalStitches + ' st)'
        )
      );

      rowDiv.append($(htmlTags.p, {
        class: 'details'
      }).append(createTimestampView(this.firstVisit)));
    }

    return rowDiv;
  }

  /**
   * Adds standard border stitches to the row.
   * @param growType A specific Stitch instance or null
   */
  borderWrap(growType: Stitch | null): Row {
    const prefix = growType === null ?
      [new StitchSequence([Knit], 3)] :
      [new StitchSequence([Knit], 2), new StitchSequence([growType], 1)];

    return new Row([
      ...prefix,
      ...this.stitches,
      new StitchSequence([WithYarnInFront], 1),
      new StitchSequence([SlipStitchPurlwise], 3)
    ]);
  }
}

/**
 * Generic helper to insert a value between every element in an array.
 */
function intersperse<T, U>(array: T[], value: U): (T | U)[] {
  return array.reduce<(T | U)[]>((acc, elem, index) => {
    if (index !== array.length - 1) {
      acc.push(elem, value);
    } else {
      acc.push(elem);
    }
    return acc;
  }, []);
}