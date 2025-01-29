export default class SubmissionResult {
    result: boolean;
    data: object;

    constructor(result: boolean, data: object = {}) {
        this.result = result;
        this.data = data;
    }

    static positive(data: object = {}): SubmissionResult {
        return new SubmissionResult(true, data);
    }

    static negative(data: object = {}): SubmissionResult {
        return new SubmissionResult(false, data);
    }

    static make(
        result: boolean,
        positiveData: object = {},
        negativeData: object = {},
    ): SubmissionResult {
        return result
            ? SubmissionResult.positive(positiveData)
            : SubmissionResult.negative(negativeData);
    }

    isPositive(): boolean {
        return this.result;
    }

    getData(): object {
        return this.data;
    }
}
