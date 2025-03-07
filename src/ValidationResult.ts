export interface ValidationResultDetails {
    message: string;
    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
}

export default class ValidationResult {
    result: boolean;
    message: ValidationResultDetails['message'];
    data: ValidationResultDetails['data'];

    constructor(result: boolean, { message = '', data = {} }: Partial<ValidationResultDetails>) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static valid(resultDetails: Partial<ValidationResultDetails> | string = {}): ValidationResult {
        if (typeof resultDetails === 'string') {
            return new ValidationResult(true, { message: resultDetails });
        }
        return new ValidationResult(true, resultDetails);
    }

    static invalid(
        resultDetails: Partial<ValidationResultDetails> | string = {},
    ): ValidationResult {
        if (typeof resultDetails === 'string') {
            return new ValidationResult(false, { message: resultDetails });
        }
        return new ValidationResult(false, resultDetails);
    }

    static make(
        result: boolean,
        resultDetailsForInvalidCase: Partial<ValidationResultDetails> | string = {},
        resultDetailsForValidCase: Partial<ValidationResultDetails> | string = {},
    ): ValidationResult {
        return result
            ? ValidationResult.valid(resultDetailsForValidCase)
            : ValidationResult.invalid(resultDetailsForInvalidCase);
    }

    isValid(): boolean {
        return this.result;
    }

    isInvalid(): boolean {
        return !this.isValid();
    }

    static areValid(validationResults: ValidationResult[]): boolean {
        return validationResults.every((validationResult) => validationResult.isValid());
    }

    hasMessage(): boolean {
        return this.message !== '';
    }

    getMessage(): string {
        return this.message;
    }

    getData(): ValidationResultDetails['data'] {
        return this.data;
    }
}
