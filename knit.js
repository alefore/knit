function createConstants(...keys) {
  const constants = keys.reduce((obj, key) => {
    obj[key] = key;
    return obj;
  }, {});
  return new Proxy(constants, {
    get: (target, name) => {
      if (name in target)
        return target[name];
      else
        throw new Error(`Constant "${String(name)}" is not defined.`);
    }
  });
}

const objectIds = createConstants(
    'configureButton', 'factoryWarnings', 'knitButton', 'buttonNext',
    'buttonPrev');

let patternFactory = new ScarfPatternFactory(
    3, [16, 14, 14, 14, 14, 12, 12, 12, 12, 12, 10, 10, 8, 8, 10, 12, 16]);

let pattern = null;

// pattern.push('Bind off');

var currentRow = 0;

function selectRow(row) {
  currentRow = row;
  const canvas = $('#knitCanvas')[0];
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  if (pattern != null) {
    updateLocationHash();
    pattern.drawToCanvas(document.getElementById('knitCanvas'));
  } else {
    $('#knitCanvas').empty();
  }
  renderPattern();
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

  if (pattern === null) return;
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
    $('#' + objectIds.knitButton).click();
  }
  if (delta < 0 && currentRow > 0) {
    selectRow(currentRow - 1);
    $('#' + objectIds.knitButton).click();
  }
}

function invertColor(color) {
  if (color === 'black') return 'white';
  if (color === 'white') return 'black';
  return color;
}

function applyInputs() {
  const warningsDiv = $('#' + objectIds.factoryWarnings).empty();
  try {
    pattern = patternFactory.build();
  } catch (error) {
    pattern = null;
    warningsDiv.append($('<p>').text(error));
  }
  $('#' + objectIds.knitButton).prop('disabled', pattern === null);
  selectRow(currentRow);
  return false;
}

function updateAllControls() {
  $('#controls form input').prop('disabled', false);
  $('#' + objectIds.buttonPrev)
      .prop('disabled', pattern === null || currentRow === 0);
  $('#' + objectIds.buttonNext)
      .prop(
          'disabled',
          pattern === null || currentRow === pattern.rowsCount() - 1);
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
      .append($('<canvas />', {id: 'knitCanvas'}))
      .append(
          $('<div/>', {id: 'controls'})
              .append(
                  $('<form/>')
                      .submit(function(e) {
                        return false;
                      })
                      .append($('<input/>', {type: 'submit', value: 'About'})
                                  .click(function() {
                                    window.open(
                                        'http://github.com/alefore/knit',
                                        '_blank');
                                  }))
                      .append($('<input/>', {
                                type: 'submit',
                                value: 'Configure',
                                id: objectIds.configureButton
                              }).click(function(e) {
                        $('#inputs').css('display', 'inline');
                        $('#patternContainer').css('display', 'none');

                        updateAllControls();
                        $('#' + objectIds.configureButton)
                            .prop('disabled', true);
                      }))
                      .append($('<input/>', {
                                type: 'submit',
                                value: 'Knit',
                                id: objectIds.knitButton
                              }).click(function(e) {
                        $('#inputs').css('display', 'none');
                        $('#patternContainer').css('display', 'inline');
                        updateAllControls();
                        $('#' + objectIds.knitButton).prop('disabled', true);
                      }))
                      .append($('<input/>', {
                                type: 'submit',
                                value: 'Prev',
                                id: objectIds.buttonPrev
                              }).click(function(e) {
                        addRow(-1);
                      }))
                      .append($('<input/>', {
                                type: 'submit',
                                value: 'Next',
                                id: objectIds.buttonNext
                              }).click(function(e) {
                        addRow(+1);
                      }))))
      .append($('<div />', {
                id: 'inputs',
                style: currentRow === 0 ? '' : 'display:none',
              })
                  .append($('<form/>').submit((e) => {
                    applyInputs();
                    if (pattern === null) {
                      $('#controls').css('display', 'inline');
                      $('#inputs').css('display', 'inline');
                      $('#patternContainer').css('display', 'none');
                    } else {
                      $('#inputs').css('display', 'none');
                      $('#controls').css('display', 'inline');
                      $('#patternContainer').css('display', 'inline');
                    }
                  }))
                  .append($('<div/>', {id: objectIds.factoryWarnings})))
      .append($('<div/>', {
        id: 'patternContainer',
        style: currentRow === 0 ? 'display:none' : 'display:inline'
      }));

  updateAllControls();
  $('#' + objectIds.configureButton)
      .prop('disabled', currentRow === 0 || pattern === null);
  $('#' + objectIds.knitButton)
      .prop('disabled', pattern != null && currentRow != 0);
  drawInputs(patternFactory.getInputs(), inputs, applyInputs);
});

document.body.addEventListener('keydown', function(e) {
  if (pattern == null) return;
  if (e.code === 'Space' || e.code === 'ArrowDown') {
    $('#' + objectIds.buttonNext).click();
    e.preventDefault();
  }
  if (e.code === 'ArrowUp') {
    $('#' + objectIds.buttonPrev).click();
    e.preventDefault();
  }
});
