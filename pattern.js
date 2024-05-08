class Pattern {
  constructor() {
    this.rows = [];
  }

  rowsCount() {
    return this.rows.length;
  }

  lastRow() {
    if (this.isEmpty()) throw new Error('Called lastRow on empty pattern.');
    return this.rows[this.rows.length - 1];
  }

  countTotalStitches() {
    return this.rows.reduce(
        (total, row) => total + row.countOutputStitches(), 0);
  }

  isEmpty() {
    return this.rowsCount() == 0;
  }

  addRow(row) {
    this.rows.push(row);
  }

  forEachRow(func) {
    this.rows.forEach(func);
  }

  drawToCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 150;

    const maxStitches =
        Math.max(...this.rows.map(row => row.countOutputStitches()));

    const stitchSizeWidth = canvas.width / this.rowsCount();
    const stitchSizeHeight = canvas.height / maxStitches;
    const stitchSize = Math.min(stitchSizeWidth, stitchSizeHeight);

    this.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      let rowOutputStitches = row.countOutputStitches();
      row.stitchSequences.forEach(stitchSequence => {
        for (let i = 0; i < stitchSequence.repetitions; i++) {
          stitchSequence.sequence.forEach(stitch => {
            if (rowIndex == currentRow)
              ctx.fillStyle = 'cyan';
            else
              ctx.fillStyle =
                  rowIndex % 2 == 0 ? stitch.color : invertColor(stitch.color);
            for (let s = 0; s < stitch.outputs; s++) {
              const x = rowIndex * stitchSize;
              const y = stitchSize *
                  (maxStitches -
                   ((rowIndex % 2 == 0) ? rowOutputStitches - stitchIndex :
                                          stitchIndex + 1));
              ctx.fillRect(x, y, stitchSize, stitchSize);
              stitchIndex++;
            }
          });
        }
      });
    });
  }
}
