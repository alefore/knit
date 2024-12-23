const objectIds = createConstants(
    'configureButton', 'factoryWarnings', 'knitButton', 'buttonNext',
    'buttonPrev');

class KnitState {
  constructor() {
    const knitState = this;
    this.inputs = parseHash();
    this.patternFactory = new ScarfPatternFactory(3);
    this.currentRow = ('row' in this.inputs) ? Number(this.inputs['row']) : 0;
    $('body')
        .append($('<canvas>', {id: 'knitCanvas'}))
        .append(
            $(htmlTags.div, {id: 'controls'})
                .append(
                    $(htmlTags.form)
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
                          knitState.#updateAllControls();
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
                          knitState.#updateAllControls();
                        }))
                        .append($(htmlTags.input, {
                                  type: htmlInputTypes.submit,
                                  value: '←',
                                  title: 'Previous row',
                                  id: objectIds.buttonPrev
                                }).click(function(e) {
                          knitState.addRow(-1);
                        }))
                        .append($(htmlTags.input, {
                                  type: htmlInputTypes.submit,
                                  value: '→',
                                  title: 'Next row',
                                  id: objectIds.buttonNext
                                }).click(function(e) {
                          knitState.addRow(+1);
                        }))))
        .append($(htmlTags.div, {
                  id: 'inputs',
                  style: knitState.currentRow === 0 ? '' : 'display:none',
                })
                    .append($(htmlTags.form))
                    .append($(htmlTags.div, {id: objectIds.factoryWarnings})))
        .append($(htmlTags.div, {
          id: 'patternContainer',
          style: knitState.currentRow === 0 ? 'display:none' : 'display:inline'
        }));

    drawInputs(this.patternFactory.getInputs(), this.inputs, function() {
      knitState.applyInputs();
    });
    this.#updateAllControls();
  }

  #parseHash() {
    const hash = window.location.hash.substring(1);  // Remove the '#' character
    const params = {};
    hash.split('&').forEach(part => {
      const item = part.split('=');
      params[item[0]] = decodeURIComponent(item[1]);
    });
    return params;
  }

  #updateLocationHash() {
    let fragments = this.patternFactory.getInputs().map(
        i => i.hasDefaultValue() ? '' : `${i.nameCamelCase()}=${i.value()}`);
    if (this.currentRow != 0) fragments.push(`row=${this.currentRow}`);
    window.location.hash = fragments.filter(str => str !== '').join('&');
  }

  selectRow(row) {
    const updatedRow = this.currentRow != row;
    this.currentRow = row;
    const canvas = $('#knitCanvas')[0];
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if (this.pattern != null) {
      this.#updateLocationHash();
      this.pattern.drawToCanvas(
          document.getElementById('knitCanvas'), this.currentRow);
    } else {
      $('#knitCanvas').empty();
    }
    this.#renderPattern();
    if (updatedRow) {
      $('#' + objectIds.knitButton).click();
      this.#updateAllControls();
    }
  }

  #renderPattern() {
    const container = $('#patternContainer');
    container.empty();

    if (this.pattern === null) return;
    let selectedRow = null;

    this.pattern.forEachRow((rowData, index) => {
      const divNormal =
          rowData.createDiv(index, index === this.currentRow, this.pattern);
      if (index === this.currentRow) {
        selectedRow = divNormal;
      }
      container.append(divNormal);
      divNormal.click(() => {
        this.selectRow(index);
      });
    });

    if (selectedRow === null) selectedRow = container.children(0);

    const rowTop = selectedRow.position().top + container.scrollTop();
    const paddingTop =  // Leave 1/3 above current row, 2/3 below.
        Math.max(0, container.innerHeight() - selectedRow.outerHeight()) / 3;

    container.scrollTop(Math.max(0, rowTop - paddingTop));
  }

  addRow(delta) {
    if (this.pattern == null) return;
    if (delta > 0 && this.currentRow < this.pattern.rows.length - 1)
      this.selectRow(this.currentRow + 1);
    if (delta < 0 && this.currentRow > 0) this.selectRow(this.currentRow - 1);
  }

  applyInputs() {
    const warningsDiv = $('#' + objectIds.factoryWarnings).empty();
    try {
      this.pattern = this.patternFactory.build();
    } catch (error) {
      this.pattern = null;
      warningsDiv.append($(htmlTags.p).text(error));
      console.log(error);
    }
    $('#' + objectIds.knitButton)
        .prop(htmlProps.disabled, this.pattern === null);
    this.selectRow(this.currentRow);
    return false;
  }

  #updateAllControls() {
    $('#controls form input').prop(htmlProps.disabled, false);
    $('#' + objectIds.buttonPrev)
        .prop(
            htmlProps.disabled, this.pattern === null || this.currentRow === 0);
    $('#' + objectIds.buttonNext)
        .prop(
            htmlProps.disabled,
            this.pattern === null ||
                this.currentRow === this.pattern.rowsCount() - 1);

    const configuring =
        $('#inputs').css(cssProps.display) != cssDisplayValues.none;
    $('#' + objectIds.configureButton).prop(htmlProps.disabled, configuring);
    $('#' + objectIds.knitButton).prop(htmlProps.disabled, !configuring);
  }
};

document.addEventListener('DOMContentLoaded', (event) => {
  const knitState = new KnitState();
  new SwipeHandler(
      function() {
        knitState.addRow(1);
      },
      function() {
        knitState.addRow(-1);
      });
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
