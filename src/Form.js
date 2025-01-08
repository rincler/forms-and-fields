import ValidationResult from './ValidationResult';
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
    validate: NOOP,
    onAfterValidate: NOOP,
    onBeforeSubmit: NOOP,
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
     * @param {function} submit
     * @param {object} options
     */
    constructor(formSelector, fields, submit, options = {}) {
        this.formElement = document.querySelector(formSelector);

        if (!this.formElement) {
            throw new Error(`Form element with the "${formSelector}" selector not found.`);
        }

        this.formSelector = formSelector;
        this.submit = submit;
        this.fields = fields;

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
        return this.hasOption(name) ? this.options[name] : DEFAULT_OPTIONS[name];
    }

    /**
     * @private
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    hasOption(name) {
        return this.options[name] !== undefined;
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
     * @returns {Promise<ValidationResult[]>}
     */
    async validate() {
        if (this.fields.every((field) => field.validators.length === 0)) {
            return [];
        }

        this.clearCss(ACTION_VALIDATING);

        this.getOption('onBeforeValidate')(this.formElement);

        this.addCss(FORM_VALIDATING_CSS_CLASS);

        const validationResults = await Promise.all(this.getAllFields().map((field) => field.validate()));
        const formValidationResult = this.hasOption('validate')
            ? await this.getOption('validate')(new FormData(this.formElement))
            : new ValidationResult(true);
        validationResults.push(formValidationResult);

        this.clearCss(ACTION_VALIDATING);

        const isValid = validationResults.every((validationResult) => validationResult.isValid());

        const cssClass = isValid ? FORM_VALID_CSS_CLASS : FORM_INVALID_CSS_CLASS;
        this.addCss(cssClass);

        this.getOption('onAfterValidate')(validationResults, this.formElement);

        return validationResults;
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
                invalidMessages: field.hasOption('invalidMessages')
                    ? field.getOption('invalidMessages')
                    : options.invalidMessages,
                defaultInvalidMessage: field.hasOption('defaultInvalidMessage')
                    ? field.getOption('defaultInvalidMessage')
                    : options.defaultInvalidMessage,
                trimEnabled: field.hasOption('trimEnabled') ? field.getOption('trimEnabled') : options.trimEnabled,
                typingDelay: field.hasOption('typingDelay') ? field.getOption('typingDelay') : options.typingDelay,
                validateOnChange: field.hasOption('validateOnChange')
                    ? field.getOption('validateOnChange')
                    : options.validateOnChange,
                validateOnType: field.hasOption('validateOnType')
                    ? field.getOption('validateOnType')
                    : options.validateOnType,
                validatorParams: field.hasOption('validatorParams')
                    ? this.getOption('validatorParams')
                    : options.validatorParams,
                onChange: field.hasOption('onChange') ? field.getOption('onChange') : options.onChange,
                onTypingStart: field.hasOption('onTypingStart')
                    ? field.getOption('onTypingStart')
                    : options.onTypingStart,
                onTypingEnd: field.hasOption('onTypingEnd') ? field.getOption('onTypingEnd') : options.onTypingEnd,
                onBeforeValidate: field.hasOption('onBeforeValidate')
                    ? field.getOption('onBeforeValidate')
                    : options.onBeforeValidateField,
                onAfterValidate: field.hasOption('onAfterValidate')
                    ? field.getOption('onAfterValidate')
                    : options.onAfterValidateField,
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

        if (typeof this.submit !== 'function') {
            throw new Error('"submit" is not a function.');
        }

        const formData = new FormData(this.formElement);

        this.getOption('onBeforeSubmit')(formData, this.formElement);

        this.clearCss(ACTION_SUBMITTING);
        this.addCss(FORM_SUBMITTING_CSS_CLASS);

        const validationResults = await this.validate();

        const isValid = validationResults.every((validationResult) => validationResult.isValid());

        if (!isValid) {
            this.clearCss(ACTION_SUBMITTING);

            return;
        }

        let submissionResult;

        try {
            submissionResult = await this.submit(formData);
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
