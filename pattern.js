export class Pattern {
  static rowSwitchStyles = createConstants('round', 'backAndForth');

  constructor() {
    this.rows = [];
    this.rowSwitchStyle = Pattern.rowSwitchStyles.backAndForth;
  }

  setRound() {
    this.rowSwitchStyle = Pattern.rowSwitchStyles.round;
    return this;
  }

  rowsCount() {
    return this.rows.length;
  }

  lastRow() {
    if (this.isEmpty()) throw new Error('Called lastRow on empty pattern.');
    return this.rows[this.rows.length - 1];
  }

  get outputStitches() {
    return this.rows.reduce((total, row) => total + row.outputStitches, 0);
  }

  isEmpty() {
    return this.rowsCount() == 0;
  }

  get showRowDirection() {
    return this.rowSwitchStyle == Pattern.rowSwitchStyles.backAndForth;
  }

  addRow(row) {
    this.rows.push(row);
  }

  forEachRow(func) {
    this.rows.forEach(func);
  }

  drawToCanvas(canvas, currentRow) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 150;

    const maxStitches = Math.max(...this.rows.map(row => row.outputStitches));

    const stitchSizeWidth = canvas.width / this.rowsCount();
    const stitchSizeHeight = canvas.height / maxStitches;
    const stitchSize = Math.min(stitchSizeWidth, stitchSizeHeight);

    this.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      let rowOutputStitches = row.outputStitches;
      row.flatten().forEach(stitch => {
        if (rowIndex == currentRow)
          ctx.fillStyle = colorIds.cyan;
        else
          ctx.fillStyle =
              this.rowSwitchStyle == Pattern.rowSwitchStyles.round ||
                  rowIndex % 2 == 0 ?
              stitch.color :
              this.#invertColor(stitch.color);
        for (let s = 0; s < stitch.outputStitches; s++) {
          const x = rowIndex * stitchSize;
          const y = stitchSize *
              (maxStitches -
               ((this.rowSwitchStyle == Pattern.rowSwitchStyles.round ||
                 rowIndex % 2 == 0) ?
                    rowOutputStitches - stitchIndex :
                    stitchIndex + 1));
          ctx.fillRect(x, y, stitchSize, stitchSize);
          stitchIndex++;
        }
      });
    });
  }

  #invertColor(color) {
    if (color === colorIds.black) return colorIds.white;
    if (color === colorIds.white) return colorIds.black;
    return color;
  }
}
