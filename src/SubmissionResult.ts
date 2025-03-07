export interface SubmissionResultDetails {
    message: string;
    data: {
        invalid?: InvalidSubmissionResultData;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
}

export type InvalidSubmissionResultData = Record<string, string> & {
    '*'?: string;
};

export default class SubmissionResult {
    result: boolean;
    message: SubmissionResultDetails['message'];
    data: SubmissionResultDetails['data'];

    constructor(result: boolean, { message = '', data = {} }: Partial<SubmissionResultDetails>) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static positive(
        resultDetails: Partial<SubmissionResultDetails> | string = {},
    ): SubmissionResult {
        if (typeof resultDetails === 'string') {
            return new SubmissionResult(true, { message: resultDetails });
        }
        return new SubmissionResult(true, resultDetails);
    }

    static negative(
        resultDetails: Partial<SubmissionResultDetails> | string = {},
    ): SubmissionResult {
        if (typeof resultDetails === 'string') {
            return new SubmissionResult(false, { message: resultDetails });
        }
        return new SubmissionResult(false, resultDetails);
    }

    static invalid(
        invalidData: InvalidSubmissionResultData,
        data: SubmissionResultDetails['data'] = {},
    ): SubmissionResult {
        return new SubmissionResult(false, {
            data: {
                ...data,
                invalid: invalidData,
            },
        });
    }

    static make(
        result: boolean,
        resultDetailsForNegativeCase: Partial<SubmissionResultDetails> | string = {},
        resultDetailsForPositiveCase: Partial<SubmissionResultDetails> | string = {},
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

    isValid(): boolean {
        return this.getData().invalid === undefined;
    }

    isInvalid(): boolean {
        return !this.isValid();
    }

    hasMessage(): boolean {
        return this.message !== '';
    }

    getMessage(): string {
        return this.message;
    }

    getData(): SubmissionResultDetails['data'] {
        return this.data;
    }
}
