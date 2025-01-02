import SubmissionResult from './SubmissionResult';

const FORM_VALIDATING_CSS_CLASS = 'f-form-validating';
const FORM_VALID_CSS_CLASS = 'f-form-valid';
const FORM_INVALID_CSS_CLASS = 'f-form-invalid';

const FORM_SUBMITTING_CSS_CLASS = 'f-form-submitting';
const FORM_SUBMIT_SUCCESS_CSS_CLASS = 'f-form-submit-success';
const FORM_SUBMIT_ERROR_CSS_CLASS = 'f-form-submit-error';

const ACTION_VALIDATING = 'action-validating';
const ACTION_SUBMITTING = 'action-submitting';

const NOOP = () => {};

const DEFAULT_OPTIONS = {
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
    onBeforeSubmit: NOOP,
    submit: NOOP,
    onAfterSubmit: NOOP,
    onAfterSubmitSuccess: NOOP,
    onAfterSubmitError: NOOP,
};

export default class Form {
    /**
     * @public
     *
     * @param {string} formSelector
     * @param {array} fields
     * @param {object} options
     */
    constructor(formSelector, fields = [], options = {}) {
        this.formElement = document.querySelector(formSelector);

        if (!this.formElement) {
            throw new Error(`Form element with the "${formSelector}" selector not found.`);
        }

        this.formSelector = formSelector;

        this.fields = fields;
        this.validatingAllFields = false;

        this.options = {};
        this.setOptions(options);
    }

    /**
     * @public
     *
     * @param {object} options
     */
    setOptions(options) {
        // eslint-disable-next-line no-restricted-syntax
        for (const name of Object.keys(options)) {
            if (name in DEFAULT_OPTIONS && options[name] !== undefined) {
                this.options[name] = options[name];
            }
        }
        this.setFieldOptions(options);
    }

    /**
     * @public
     *
     * @param {string} name
     *
     * @returns {any}
     */
    getOption(name) {
        return this.options[name] !== undefined ? this.options[name] : DEFAULT_OPTIONS[name];
    }

    /**
     * @public
     */
    listen() {
        this.formElement.addEventListener('submit', this.onSubmitForm.bind(this));

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            field.listen();
        }
    }

    /**
     * @public
     *
     * @param {boolean} force
     *
     * @returns {Promise<boolean>}
     */
    async isValid(force = false) {
        const result = await Promise.all(this.getAllFields().map((field) => field.isValid(force)));
        return result.every((isValid) => isValid);
    }

    /**
     * @public
     *
     * @returns {Promise<void>}
     */
    async validate() {
        if (this.fields.every((field) => field.validators.length === 0)) {
            return;
        }

        this.validatingAllFields = true;

        this.clearCss(ACTION_VALIDATING);

        this.getOption('onBeforeValidate')(this.formElement);

        this.addCss(FORM_VALIDATING_CSS_CLASS);

        await Promise.all(this.getAllFields().map((field) => field.validate()));

        this.clearCss(ACTION_VALIDATING);

        const isValid = await this.isValid();

        const cssClass = isValid ? FORM_VALID_CSS_CLASS : FORM_INVALID_CSS_CLASS;
        this.addCss(cssClass);

        this.getOption('onAfterValidate')(isValid, this.formElement);

        this.validatingAllFields = false;
    }

    /**
     * @private
     *
     * @param {object} options
     */
    setFieldOptions(options) {
        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            field.setOptions({
                invalidMessages: options.invalidMessages,
                defaultInvalidMessage: options.defaultInvalidMessage,
                validateOnChange: options.validateOnChange,
                validateOnType: options.validateOnType,
                typingDelay: options.typingDelay,
                onTypingStart: options.onTypingStart,
                onTypingEnd: options.onTypingEnd,
                onChange: options.onChange,
                validatorParams: options.validatorParams,
                trimEnabled: options.trimEnabled,
                onBeforeValidate: (fieldElement, formElement) => {
                    if (options.onBeforeFieldValidate) {
                        options.onBeforeFieldValidate(fieldElement, formElement);
                    }

                    if (this.validatingAllFields) {
                        return;
                    }

                    this.clearCss(ACTION_VALIDATING);

                    this.getOption('onBeforeValidate')(this.formElement);

                    this.addCss(FORM_VALIDATING_CSS_CLASS);
                },
                onAfterValidate: async (validationResult, fieldElement, formElement) => {
                    if (options.onAfterFieldValidate) {
                        options.onAfterFieldValidate(validationResult, fieldElement, formElement);
                    }

                    if (this.validatingAllFields) {
                        return;
                    }

                    this.clearCss(ACTION_VALIDATING);

                    const isFormValid = await this.isValid();

                    const cssClass = isFormValid ? FORM_VALID_CSS_CLASS : FORM_INVALID_CSS_CLASS;
                    this.addCss(cssClass);

                    this.getOption('onAfterValidate')(isFormValid, this.formElement);
                },
            });
        }
    }

    /**
     * @private
     *
     * @param {object} e
     *
     * @returns {Promise<void>}
     */
    async onSubmitForm(e) {
        e.preventDefault();

        if (this.getOption('submit') === NOOP) {
            return;
        }

        const formData = new FormData(this.formElement);

        this.getOption('onBeforeSubmit')(formData, this.formElement);

        this.clearCss(ACTION_SUBMITTING);
        this.addCss(FORM_SUBMITTING_CSS_CLASS);

        await this.validate();

        const isValid = await this.isValid();

        if (!isValid) {
            this.clearCss(ACTION_SUBMITTING);

            return;
        }

        let submissionResult;

        try {
            submissionResult = await this.getOption('submit')(formData, this.formElement);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            submissionResult = new SubmissionResult(false);
        }

        this.clearCss(ACTION_SUBMITTING);

        this.getOption('onAfterSubmit')(submissionResult, this.formElement);

        if (submissionResult && submissionResult.isSuccess()) {
            this.addCss(FORM_SUBMIT_SUCCESS_CSS_CLASS);

            this.getOption('onAfterSubmitSuccess')(submissionResult.getData(), this.formElement);
        }

        if (submissionResult && !submissionResult.isSuccess()) {
            this.addCss(FORM_SUBMIT_ERROR_CSS_CLASS);

            this.getOption('onAfterSubmitError')(submissionResult.getData(), this.formElement);
        }
    }

    /**
     * @private
     *
     * @returns {Field[]}
     */
    getAllFields() {
        const fields = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            if (!field.exists()) {
                continue;
            }

            fields.push(field);

            if (field.isList() && !field.isRadio()) {
                fields.push(...field.getVirtualFieldsOfList());
            }
        }

        return fields;
    }

    /**
     * @private
     *
     * @param {string} action
     */
    clearCss(action) {
        if (action === ACTION_VALIDATING) {
            this.formElement.classList.remove(FORM_VALIDATING_CSS_CLASS, FORM_VALID_CSS_CLASS, FORM_INVALID_CSS_CLASS);
        }

        if (action === ACTION_SUBMITTING) {
            this.formElement.classList.remove(
                FORM_SUBMITTING_CSS_CLASS,
                FORM_SUBMIT_SUCCESS_CSS_CLASS,
                FORM_SUBMIT_ERROR_CSS_CLASS
            );
        }
    }

    /**
     * @private
     *
     * @param {string} cssClass
     */
    addCss(cssClass) {
        this.formElement.classList.add(cssClass);
    }
}
