let patternFactory = new ScarfPatternFactory(
    3,
    mossStitchRow,
    [16, 14, 14, 14, 14, 12, 12, 12, 12, 12, 10, 10, 8, 8, 10, 12, 16]);

let pattern = null;

// pattern.push('Bind off');

var currentRow = 0;

function selectRow(row) {
  currentRow = row;
  if (pattern != null) {
    renderPattern();
    pattern.drawToCanvas(document.getElementById('knitCanvas'));
  }
}

function renderPattern() {
  const container = document.getElementById('patternContainer');
  container.innerHTML = '';

  const currentDivContainer = document.getElementById('currentRow');
  currentDivContainer.innerHTML = '';

  let selectedRow = null;

  pattern.forEachRow((rowData, index) => {
    const divNormal = rowData.createDiv(index, false, pattern);
    container.appendChild(divNormal);
    divNormal.addEventListener('click', () => {
      selectRow(index);
    });
    if (index === currentRow) {
      divNormal.classList.add('highlight');
      currentDivContainer.appendChild(rowData.createDiv(index, true, pattern));
      selectedRow = divNormal;
    }
  });


      //const style = window.getComputedStyle(selectedRow);
      //const marginTop = parseInt(style.marginTop, 10);
  const rowTop = selectedRow.offsetTop; // - marginTop;
  const rowHeight = selectedRow.offsetHeight;

  const containerHeight = container.offsetHeight;
  const rowCenter = rowTop + (rowHeight / 2);
  scrollPosition = rowCenter - (containerHeight / 2);
  scrollPosition = Math.max(scrollPosition, 0);

  const maxScrollPosition = container.scrollHeight - container.offsetHeight;
  scrollPosition = Math.min(scrollPosition, maxScrollPosition);
  container.scrollTop = scrollPosition;
}

function addRow(delta) {
  if (delta > 0 && currentRow < pattern.rows.length - 1) {
    selectRow(currentRow + 1);
  }
  if (delta < 0 && currentRow > 0) {
    selectRow(currentRow - 1);
  }
}

function invertColor(color) {
  if (color === 'black') return 'white';
  if (color === 'white') return 'black';
  return color;
}

function applyInputs() {
  pattern = patternFactory.build();
  selectRow(0);
  return false;
}

document.addEventListener('DOMContentLoaded', (event) => {
  drawInputs(patternFactory.getInputs());
  applyInputs();
});

document.body.addEventListener('keydown', function(e) {
  if (pattern == null) return;
  if (e.code === 'Space' || e.code === 'ArrowRight') {
    addRow(1);
    e.preventDefault();
  }
  if (e.code === 'ArrowLeft') {
    addRow(-1);
    e.preventDefault();
  }
});
