export default class SubmissionResult {
    result: boolean;
    message: string;
    data: object;

    constructor(result: boolean, { message = '', data = {} }: { message?: string; data?: object }) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static positive(data: object = {}): SubmissionResult {
        return new SubmissionResult(true, { data });
    }

    static negative(message: string = '', data: object = {}): SubmissionResult {
        return new SubmissionResult(false, { message, data });
    }

    static make(
        result: boolean,
        messageForNegative: string = '',
        dataForPositive: object = {},
        dataForNegative: object = {},
    ): SubmissionResult {
        return result
            ? SubmissionResult.positive(dataForPositive)
            : SubmissionResult.negative(messageForNegative, dataForNegative);
    }

    isPositive(): boolean {
        return this.result;
    }

    isNegative(): boolean {
        return !this.result;
    }

    hasMessage(): boolean {
        return this.message !== '';
    }

    getMessage(): string {
        return this.message;
    }

    getData(): object {
        return this.data;
    }
}
