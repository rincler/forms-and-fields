export default class ValidationResult {
    /**
     * @private
     *
     * @param {boolean} result
     * @param {string} message
     */
    constructor(result, message = '') {
        this.result = result;
        this.message = message;
    }

    /**
     * @public
     */
    static valid() {
        return new ValidationResult(true);
    }

    /**
     * @public
     *
     * @param {string} message
     */
    static invalid(message = '') {
        return new ValidationResult(false, message);
    }

    /**
     * @public
     *
     * @param {boolean} result
     * @param {string} message
     */
    static make(result, message = '') {
        return result ? ValidationResult.valid() : ValidationResult.invalid(message);
    }

    /**
     * @public
     *
     * @returns {boolean}
     */
    isValid() {
        return this.result;
    }

    /**
     * @public
     *
     * @param {ValidationResult[]} validationResults
     *
     * @returns {boolean}
     */
    static areValid(validationResults) {
        return validationResults.every((validationResult) => validationResult.isValid());
    }

    /**
     * @public
     *
     * @returns {boolean}
     */
    hasMessage() {
        return this.message !== '';
    }

    /**
     * @public
     *
     * @returns {string}
     */
    getMessage() {
        return this.message;
    }
}
