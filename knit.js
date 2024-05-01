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
  const container = $('#patternContainer');
  container.empty();

  let selectedRow = null;

  pattern.forEachRow((rowData, index) => {
    const divNormal = rowData.createDiv(index, index === currentRow, pattern);
    if (index === currentRow) {
      selectedRow = divNormal;
    }
    container.append(divNormal);
    divNormal.click(() => {
      selectRow(index);
    });
  });

  const rowTop = selectedRow.position().top + container.scrollTop();
  const paddingTop =  // Leave 1/3 above current row, 2/3 below.
      Math.max(0, container.innerHeight() - selectedRow.outerHeight()) / 3;

  container.scrollTop(Math.max(0, rowTop - paddingTop));
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

  $('body')
      .append($('<div />', {id: 'inputsDiv'})
                  .append($('<form/>')
                              .submit(function(e) {
                                return applyInputs();
                              })
                              .append($('<ul/>', {id: 'inputs'}))))
      .append($('<canvas />', {id: 'knitCanvas'}))
      .append(
          $('<div/>', {id: 'controls'})
              .append($('<form/>')
                          .submit(function(e) {
                            return false;
                          })
                          .append($('<input/>', {type: 'submit', value: 'Prev'})
                                      .click(function(e) {
                                        addRow(-1);
                                      }))
                          .append($('<input/>', {type: 'submit', value: 'Next'})
                                      .click(function(e) {
                                        addRow(+1);
                                      }))))
      .append($('<div/>', {id: 'patternContainer'}));

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
