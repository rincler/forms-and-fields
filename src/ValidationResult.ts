interface ResultDetails {
    message: string;
    data: object;
}

export default class ValidationResult {
    result: boolean;
    message: string;
    data: object;

    constructor(result: boolean, { message = '', data = {} }: Partial<ResultDetails>) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static valid(resultDetails: Partial<ResultDetails> | string = {}): ValidationResult {
        if (typeof resultDetails === 'string') {
            return new ValidationResult(true, { message: resultDetails });
        }
        return new ValidationResult(true, resultDetails);
    }

    static invalid(resultDetails: Partial<ResultDetails> | string = {}): ValidationResult {
        if (typeof resultDetails === 'string') {
            return new ValidationResult(false, { message: resultDetails });
        }
        return new ValidationResult(false, resultDetails);
    }

    static make(
        result: boolean,
        resultDetailsForInvalidCase: Partial<ResultDetails> | string = {},
        resultDetailsForValidCase: Partial<ResultDetails> | string = {},
    ): ValidationResult {
        return result
            ? ValidationResult.valid(resultDetailsForValidCase)
            : ValidationResult.invalid(resultDetailsForInvalidCase);
    }

    isValid(): boolean {
        return this.result;
    }

    isInvalid(): boolean {
        return !this.result;
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

    getData(): object {
        return this.data;
    }
}
