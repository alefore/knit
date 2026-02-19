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

export class Row {
  public stitches: StitchSequence[];
  public firstVisit: Date | null;

  constructor(stitches: StitchSequence[] = []) {
    this.stitches = stitches;
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