export default class SubmissionResult {
    result: boolean;
    data: object;

    constructor(result: boolean, data: object = {}) {
        this.result = result;
        this.data = data;
    }

    isPositive(): boolean {
        return this.result;
    }

    getData(): object {
        return this.data;
    }
}
