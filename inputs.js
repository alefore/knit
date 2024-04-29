class PatternFactoryInput {
  constructor(name, tooltip, defaultValue, units, selectValues) {
    this.name = name;
    this.tooltip = tooltip;
    this.defaultValue = defaultValue;
    this.units = units;
    this.formInput = null;
    this.selectValues = selectValues;
  }

  renderTableRow(parsedHash) {
    const li = $('<li>').append(
        $('<span>').text(this.name + ': ').attr('class', 'name'));
    console.log('Searching: ' + this.nameCamelCase());
    let defaultValue = Object.keys(parsedHash).includes(this.nameCamelCase()) ?
        parsedHash[this.nameCamelCase()] :
        this.defaultValue;
    if (this.selectValues == null) {
      const input = this;
      li.append($('<span>').append($('<input>')
                                       .attr('id', this.id())
                                       .attr('title', this.tooltip)
                                       .attr('value', defaultValue)))
    } else {
      const select = $('<select>').attr('id', this.id());
      this.selectValues.forEach(function(id) {
        select.append($('<option>').text(id).attr('value', id))
      });
      li.append(select.val(
          this.selectValues.includes(defaultValue) ? defaultValue :
                                                     this.defaultValue));
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

  hasDefaultValue() {
    return this.value() == this.defaultValue;
  }

  id() {
    return 'patternFactoryInput' + this.nameCamelCase();
  }

  nameCamelCase() {
    return this.name.replace(/\s+/g, '');
  }
}

function drawInputs(inputs, parsedHash) {
  const list = $('#inputs');
  inputs.forEach(function(input) {
    list.append(input.renderTableRow(parsedHash == null ? {} : parsedHash));
  });

  const inputElement = document.createElement('input');
  inputElement.setAttribute('type', 'submit');
  inputElement.setAttribute('value', 'Update');

  list.append($('<li>').append(inputElement));
}

function hideInputHtml() {
  $('#inputsDiv').css('display', 'none');
}

function parseHash() {
  const hash = window.location.hash.substring(1);  // Remove the '#' character
  const params = {};

  hash.split('&').forEach(part => {
    const item = part.split('=');
    params[item[0]] = decodeURIComponent(item[1]);
  });

  console.log(params);
  return params;
}
