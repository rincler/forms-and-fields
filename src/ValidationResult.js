export default class ValidationResult {
    /**
     * @public
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
     *
     * @returns {boolean}
     */
    isValid() {
        return this.result;
    }

    /**
     * @public
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
     * @param message
     */
    setMessage(message) {
        this.message = message;
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
