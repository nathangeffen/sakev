export class Message {
    constructor(_, div) {
        this.div = div;
    }
    set(text, seconds) {
        this.div.textContent = text;
        if (seconds) {
            setTimeout(() => {
                this.div.textContent = "";
            }, seconds);
        }
    }
}
