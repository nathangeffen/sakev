
export class Message {

  div: HTMLDivElement;

  constructor(_: any, div: HTMLDivElement) {
    this.div = div;
  }

  set(this: Message, text: string, seconds: number) {
    this.div.textContent = text;
    if (seconds) {
      setTimeout(() => {
        this.div.textContent = "";
      }, seconds);
    }
  }
}


