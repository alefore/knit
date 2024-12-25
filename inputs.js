class PatternFactoryInput {
  constructor(name, tooltip, defaultValue, units, selectValues) {
    this.name = name;
    this.tooltip = tooltip;
    this.defaultValue = defaultValue;
    this.units = units;
    this.formInput = null;
    this.selectValues = selectValues;
    this.listener = new EventListener();
    this.tr = null;
  }

  setValuesFromHash(parsedHash) {
    const input = this;
    input.tr = $(htmlTags.tr, {
                 id: 'tr' + this.id()
               }).append($(htmlTags.td, {class: 'name'}).text(this.name));
    let defaultValue = Object.keys(parsedHash).includes(this.nameCamelCase()) ?
        parsedHash[this.nameCamelCase()] :
        this.defaultValue;
    if (this.selectValues == null) {
      input.tr.append(
          $(htmlTags.td)
              .append($(htmlTags.input, {
                        id: this.id(),
                        title: this.tooltip,
                        value: defaultValue,
                        size: 4
                      }).on(eventIds.input, () => input.listener.notify())));
    } else {
      const select = $(htmlTags.select, {id: this.id()});
      this.selectValues.forEach(function(id) {
        select.append($(htmlTags.option, {value: id}).text(id))
      });
      input.tr.append(
          $(htmlTags.td)
              .append(select
                          .val(
                              this.selectValues.includes(defaultValue) ?
                                  defaultValue :
                                  this.defaultValue)
                          .on(eventIds.input, () => input.listener.notify())));
    }
    if (this.units !== null)
      input.tr.append($(htmlTags.td, {class: 'units'}).text(this.units));
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

  setVisible(eventListener, valueSupplier) {
    const tr = this.tr;
    eventListener.addListener(function() {
      if (valueSupplier())
        tr.show();
      else
        tr.hide();
    });
  }
}

function drawInputs(inputs, parsedHash) {
  const table = $(htmlTags.table).appendTo('#inputs form');
  inputs.forEach(function(input) {
    input.setValuesFromHash(parsedHash == null ? {} : parsedHash);
    table.append(input.tr);
  });
}

function parseHash() {
  const hash = window.location.hash.substring(1);  // Remove the '#' character
  const params = {};
  hash.split('&').forEach(part => {
    const item = part.split('=');
    params[item[0]] = decodeURIComponent(item[1]);
  });
  return params;
}
