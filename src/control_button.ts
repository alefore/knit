import {htmlInputTypes, htmlTags} from './constants.js';
import {EventListener} from './listener.js';

export class ControlButton {
  private text: string;
  private description: string;
  private htmlObject: HTMLInputElement;

  constructor(
      id: string|null, text: string, description: string,
      action: (e: MouseEvent) => void) {
    this.text = text;
    this.description = description;
    const button = document.createElement(htmlTags.input) as HTMLInputElement;
    button.type = htmlInputTypes.submit;
    button.value = this.text;
    button.title = this.description;
    if (id) {
      button.id = id;
    }
    button.addEventListener('click', action);
    this.htmlObject = button;
  }

  appendHtml(container: HTMLElement): this {
    container.appendChild(this.htmlObject);
    return this;
  }

  setEnabled(stateListener: EventListener, value: () => boolean): ControlButton {
    stateListener.addListener(() => {
      this.htmlObject.disabled = !value();
    });
    return this;
  }

  setVisibility(stateListener: EventListener, value: () => boolean): ControlButton {
    stateListener.addListener(() => {
      this.htmlObject.hidden = !value();
    });
    return this;
  }
}
