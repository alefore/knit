class PatternFactoryInput {
  constructor(name, tooltip, defaultValue, units) {
    this.name = name;
    this.tooltip = tooltip;
    this.defaultValue = defaultValue;
    this.units = units;
    this.formInput = null;
  }

  renderTableRow() {
    return $('<li>')
        .append($('<span>').text(this.name + ': ').attr('class', 'name'))
        .append($('<span>').append($('<input>')
                                       .attr('id', this.id())
                                       .attr('title', this.tooltip)
                                       .attr('value', this.defaultValue)))
        .append($('<span>').text(' ' + this.units).attr('class', 'units'));
  }

  setFormInput(formInput) {
    this.formInput = formInput;
  }

  value() {
    return Number($('#' + this.id()).val());
  }

  id() {
    return 'patternFactoryInput' + this.name.replace(/\s+/g, '');
  }
}

function drawInputs(inputs) {
  const list = $('#inputs');
  inputs.forEach(function(input) {
    list.append(input.renderTableRow());
  });

  const inputElement = document.createElement('input');
  inputElement.setAttribute('type', 'submit');
  inputElement.setAttribute('value', 'Update');

  list.append($('<li>').append(inputElement));
}

function hideInputHtml() {
  $('#inputsDiv').css('display', 'none');
}
