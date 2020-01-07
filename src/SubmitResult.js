export default class SubmitResult {
    /**
     * @public
     *
     * @param {boolean} result
     * @param {object} data
     */
    constructor(result, data = {}) {
        this.result = result;
        this.data = data;
    }

    /**
     * @public
     *
     * @returns {boolean}
     */
    isSuccess() {
        return this.result;
    }

    /**
     * @public
     *
     * @returns {Object}
     */
    getData() {
        return this.data;
    }
}
