export default class ValidationResult {
    result: boolean;
    message: string;

    constructor(result: boolean, message: string = '') {
        this.result = result;
        this.message = message;
    }

    static valid(): ValidationResult {
        return new ValidationResult(true);
    }

    static invalid(message: string = ''): ValidationResult {
        return new ValidationResult(false, message);
    }

    static make(result: boolean, message: string = ''): ValidationResult {
        return result ? ValidationResult.valid() : ValidationResult.invalid(message);
    }

    isValid(): boolean {
        return this.result;
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
}
