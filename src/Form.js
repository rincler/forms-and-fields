import ValidationResult from './ValidationResult';
import SubmissionResult from './SubmissionResult';

const FORM_VALIDATING_CSS_CLASS = 'f-form-validating';
const FORM_VALID_CSS_CLASS = 'f-form-valid';
const FORM_INVALID_CSS_CLASS = 'f-form-invalid';

const FORM_SUBMITTING_CSS_CLASS = 'f-form-submitting';
const FORM_SUBMIT_SUCCESS_CSS_CLASS = 'f-form-submit-success';
const FORM_SUBMIT_ERROR_CSS_CLASS = 'f-form-submit-error';

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

        this.getOption('onBeforeValidate')(this.formElement);

        this.setCssClass(FORM_VALIDATING_CSS_CLASS);

        const validationResults = await Promise.all(
            this.getAllFields().map((field) => field.validate()),
        );
        const formValidationResult =
            this.hasOption('validate') && ValidationResult.areValid(validationResults)
                ? await this.getOption('validate')(new FormData(this.formElement))
                : new ValidationResult(ValidationResult.areValid(validationResults));
        validationResults.push(formValidationResult);

        const isValid = ValidationResult.areValid(validationResults);

        this.setCssClass(isValid ? FORM_VALID_CSS_CLASS : FORM_INVALID_CSS_CLASS);

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
                trimEnabled: field.hasOption('trimEnabled')
                    ? field.getOption('trimEnabled')
                    : options.trimEnabled,
                typingDelay: field.hasOption('typingDelay')
                    ? field.getOption('typingDelay')
                    : options.typingDelay,
                validateOnChange: field.hasOption('validateOnChange')
                    ? field.getOption('validateOnChange')
                    : options.validateOnChange,
                validateOnType: field.hasOption('validateOnType')
                    ? field.getOption('validateOnType')
                    : options.validateOnType,
                validatorParams: field.hasOption('validatorParams')
                    ? this.getOption('validatorParams')
                    : options.validatorParams,
                onChange: field.hasOption('onChange')
                    ? field.getOption('onChange')
                    : options.onChange,
                onTypingStart: field.hasOption('onTypingStart')
                    ? field.getOption('onTypingStart')
                    : options.onTypingStart,
                onTypingEnd: field.hasOption('onTypingEnd')
                    ? field.getOption('onTypingEnd')
                    : options.onTypingEnd,
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

        const validationResults = await this.validate();

        const isValid = ValidationResult.areValid(validationResults);

        if (!isValid) {
            return;
        }

        let submissionResult;

        this.getOption('onBeforeSubmit')(formData, this.formElement);

        this.setCssClass(FORM_SUBMITTING_CSS_CLASS);

        try {
            submissionResult = await this.submit(formData);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            submissionResult = new SubmissionResult(false);
        }

        this.getOption('onAfterSubmit')(submissionResult, this.formElement);

        if (submissionResult.isSuccess()) {
            this.setCssClass(FORM_SUBMIT_SUCCESS_CSS_CLASS);
            this.getOption('onAfterSubmitSuccess')(submissionResult.getData(), this.formElement);
        } else {
            this.setCssClass(FORM_SUBMIT_ERROR_CSS_CLASS);
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

            if (field.isList()) {
                fields.push(...field.getVirtualFieldsOfList());
            }
        }

        return fields;
    }

    setCssClass(cssClass) {
        this.formElement.classList.remove(
            FORM_VALIDATING_CSS_CLASS,
            FORM_VALID_CSS_CLASS,
            FORM_INVALID_CSS_CLASS,
            FORM_SUBMITTING_CSS_CLASS,
            FORM_SUBMIT_SUCCESS_CSS_CLASS,
            FORM_SUBMIT_ERROR_CSS_CLASS,
        );
        this.formElement.classList.add(cssClass);
    }
}
