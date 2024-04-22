class PatternFactoryInput {
  constructor(name, tooltip, defaultValue, units, selectValues) {
    this.name = name;
    this.tooltip = tooltip;
    this.defaultValue = defaultValue;
    this.units = units;
    this.formInput = null;
    this.selectValues = selectValues;
  }

  renderTableRow() {
    const li = $('<li>').append(
        $('<span>').text(this.name + ': ').attr('class', 'name'));
    if (this.selectValues == null)
      li.append($('<span>').append($('<input>')
                                       .attr('id', this.id())
                                       .attr('title', this.tooltip)
                                       .attr('value', this.defaultValue)))
      else {
        const select = $('<select>').attr('id', this.id());
        this.selectValues.forEach(function(id) {
          select.append($('<option>').text(id).attr('value', id))
        });
        li.append(select.val(this.defaultValue));
      }
    if (this.units != null)
      li.append($('<span>').text(' ' + this.units).attr('class', 'units'));
    return li;
  }

  setFormInput(formInput) {
    this.formInput = formInput;
  }

  value() {
    return $('#' + this.id()).val();
  }

  numberValue() {
    return Number(this.value());
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
