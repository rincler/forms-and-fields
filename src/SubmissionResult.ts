interface ResultDetails {
    message: string;
    data: object;
}

export default class SubmissionResult {
    result: boolean;
    message: string;
    data: object;

    constructor(result: boolean, { message = '', data = {} }: Partial<ResultDetails>) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static positive(resultDetails: Partial<ResultDetails> | string = {}): SubmissionResult {
        if (typeof resultDetails === 'string') {
            return new SubmissionResult(true, { message: resultDetails });
        }
        return new SubmissionResult(true, resultDetails);
    }

    static negative(resultDetails: Partial<ResultDetails> | string = {}): SubmissionResult {
        if (typeof resultDetails === 'string') {
            return new SubmissionResult(false, { message: resultDetails });
        }
        return new SubmissionResult(false, resultDetails);
    }

    static make(
        result: boolean,
        resultDetailsForNegativeCase: Partial<ResultDetails> | string = {},
        resultDetailsForPositiveCase: Partial<ResultDetails> | string = {},
    ): SubmissionResult {
        return result
            ? SubmissionResult.positive(resultDetailsForPositiveCase)
            : SubmissionResult.negative(resultDetailsForNegativeCase);
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
