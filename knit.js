let patternFactory = new ScarfPatternFactory(
    3, [16, 14, 14, 14, 14, 12, 12, 12, 12, 12, 10, 10, 8, 8, 10, 12, 16]);

let pattern = null;

// pattern.push('Bind off');

var currentRow = 0;

function selectRow(row) {
  currentRow = row;
  if (pattern != null) {
    updateLocationHash();
    renderPattern();
    pattern.drawToCanvas(document.getElementById('knitCanvas'));
  }
}

function updateLocationHash() {
  let fragments = patternFactory.getInputs().map(
      i => i.hasDefaultValue() ? '' : `${i.nameCamelCase()}=${i.value()}`);
  if (currentRow != 0) fragments.push(`row=${currentRow}`);
  window.location.hash = fragments.filter(str => str !== '').join('&');
}

function renderPattern() {
  const container = document.getElementById('patternContainer');
  container.innerHTML = '';

  let selectedRow = null;

  pattern.forEachRow((rowData, index) => {
    const divNormal = rowData.createDiv(index, index === currentRow, pattern);
    if (index === currentRow) {
      divNormal.classList.add('highlight');
      selectedRow = divNormal;
    }
    container.appendChild(divNormal);
    divNormal.addEventListener('click', () => {
      selectRow(index);
    });
  });

  const rowTop = selectedRow.offsetTop;  // - marginTop;
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
  selectRow(currentRow);
  return false;
}

document.addEventListener('DOMContentLoaded', (event) => {
  new SwipeHandler(
      function() {
        addRow(1);
      },
      function() {
        addRow(-1);
      });
  const inputs = parseHash();
  if ('row' in inputs) currentRow = Number(inputs['row']);
  drawInputs(patternFactory.getInputs(), inputs);
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
