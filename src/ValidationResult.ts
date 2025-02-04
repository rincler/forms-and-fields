export default class ValidationResult {
    result: boolean;
    message: string;
    data: object;

    constructor(result: boolean, { message = '', data = {} }: { message?: string; data?: object }) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    static valid(data: object = {}): ValidationResult {
        return new ValidationResult(true, { data });
    }

    static invalid(message: string = '', data: object = {}): ValidationResult {
        return new ValidationResult(false, { message, data });
    }

    static make(
        result: boolean,
        messageForInvalid: string = '',
        dataForValid: object = {},
        dataForInvalid: object = {},
    ): ValidationResult {
        return result
            ? ValidationResult.valid(dataForValid)
            : ValidationResult.invalid(messageForInvalid, dataForInvalid);
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

    getData(): object {
        return this.data;
    }
}
