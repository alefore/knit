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
        .append($('<span>').text(this.name + ': '))
        .append($('<span>')
            .append($('<input>')
                        .attr('title', this.tooltip)
                        .attr('value', this.defaultValue)));
  }

  setFormInput(formInput) {
    this.formInput = formInput;
  }
}

function drawInputs(inputs) {
  const list = $('#inputs');
  inputs.forEach(
      function (input) {
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
