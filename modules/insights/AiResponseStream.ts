import { GenerateContentResponse } from '@google/genai';

export default class AiResponseStream {
  constructor(
    private readonly response:
      | AsyncGenerator<GenerateContentResponse, GenerateContentResponse, boolean>
      | string,
  ) {}

  private responseText = '';

  private onEndCallback: (responseText: string) => void = () => {};

  public async next() {
    if (typeof this.response === 'string') {
      return { value: this.response, done: true };
    }
    const iterator = this.response[Symbol.asyncIterator]();
    const { value, done } = await iterator.next();
    let text;
    if (done) {
      this.onEndCallback(this.responseText);
    } else {
      text = value?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      this.responseText += text;
    }
    return { value: text, done };
  }

  public async onEnd(callback: (responseText: string) => void) {
    this.onEndCallback = callback;
  }
}
