const objectIds = createConstants(
    'configureButton', 'factoryWarnings', 'knitButton', 'buttonNext',
    'buttonPrev');

let patternFactory = new ScarfPatternFactory(3);

let pattern = null;

// pattern.push('Bind off');

var currentRow = 0;

function selectRow(row) {
  const updatedRow = currentRow != row;
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
  if (updatedRow) {
    $('#' + objectIds.knitButton).click();
    updateAllControls();
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

  if (selectedRow === null) selectedRow = container.children(0);

  const rowTop = selectedRow.position().top + container.scrollTop();
  const paddingTop =  // Leave 1/3 above current row, 2/3 below.
      Math.max(0, container.innerHeight() - selectedRow.outerHeight()) / 3;

  container.scrollTop(Math.max(0, rowTop - paddingTop));
}

function addRow(delta) {
  if (delta > 0 && currentRow < pattern.rows.length - 1)
    selectRow(currentRow + 1);
  if (delta < 0 && currentRow > 0) selectRow(currentRow - 1);
}

function invertColor(color) {
  if (color === colorIds.black) return colorIds.white;
  if (color === colorIds.white) return colorIds.black;
  return color;
}

function applyInputs() {
  const warningsDiv = $('#' + objectIds.factoryWarnings).empty();
  try {
    pattern = patternFactory.build();
  } catch (error) {
    pattern = null;
    warningsDiv.append($(htmlTags.p).text(error));
    console.log(error);
  }
  $('#' + objectIds.knitButton).prop(htmlProps.disabled, pattern === null);
  selectRow(currentRow);
  return false;
}

function updateAllControls() {
  $('#controls form input').prop(htmlProps.disabled, false);
  $('#' + objectIds.buttonPrev)
      .prop(htmlProps.disabled, pattern === null || currentRow === 0);
  $('#' + objectIds.buttonNext)
      .prop(
          htmlProps.disabled,
          pattern === null || currentRow === pattern.rowsCount() - 1);

  const configuring =
      $('#inputs').css(cssProps.display) != cssDisplayValues.none;
  $('#' + objectIds.configureButton).prop(htmlProps.disabled, configuring);
  $('#' + objectIds.knitButton).prop(htmlProps.disabled, !configuring);
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
      .append($('<canvas>', {id: 'knitCanvas'}))
      .append(
          $(htmlTags.div, {id: 'controls'})
              .append($(htmlTags.form)
                          .submit(function(e) {
                            return false;
                          })
                          .append($(htmlTags.input, {
                                    type: htmlInputTypes.submit,
                                    value: '📖',
                                    title: 'About this software'
                                  }).click(function() {
                            window.open(
                                'http://github.com/alefore/knit', '_blank');
                          }))
                          .append($(htmlTags.input, {
                                    type: htmlInputTypes.submit,
                                    value: '⚙️',
                                    title: 'Configure the pattern',
                                    id: objectIds.configureButton
                                  }).click(function(e) {
                            $('#inputs').css(
                                cssProps.display, cssDisplayValues.inline);
                            $('#patternContainer')
                                .css(cssProps.display, cssDisplayValues.none);
                            updateAllControls();
                          }))
                          .append($(htmlTags.input, {
                                    type: htmlInputTypes.submit,
                                    value: '🚀',
                                    title: 'Start knitting',
                                    id: objectIds.knitButton
                                  }).click(function(e) {
                            $('#inputs').css(
                                cssProps.display, cssDisplayValues.none);
                            $('#patternContainer')
                                .css(cssProps.display, cssDisplayValues.inline);
                            updateAllControls();
                          }))
                          .append($(htmlTags.input, {
                                    type: htmlInputTypes.submit,
                                    value: '←',
                                    title: 'Previous row',
                                    id: objectIds.buttonPrev
                                  }).click(function(e) {
                            addRow(-1);
                          }))
                          .append($(htmlTags.input, {
                                    type: htmlInputTypes.submit,
                                    value: '→',
                                    title: 'Next row',
                                    id: objectIds.buttonNext
                                  }).click(function(e) {
                            addRow(+1);
                          }))))
      .append($(htmlTags.div, {
                id: 'inputs',
                style: currentRow === 0 ? '' : 'display:none',
              })
                  .append($(htmlTags.form))
                  .append($(htmlTags.div, {id: objectIds.factoryWarnings})))
      .append($(htmlTags.div, {
        id: 'patternContainer',
        style: currentRow === 0 ? 'display:none' : 'display:inline'
      }));

  drawInputs(patternFactory.getInputs(), inputs, applyInputs);
  updateAllControls();
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
