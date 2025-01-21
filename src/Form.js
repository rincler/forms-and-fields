import ValidationResult from './ValidationResult';
import { ignoreRejects, startAction, finishAction } from './Reject';

const FORM_VALIDATING_STATUS = 'ff-form-validating';
const FORM_VALID_STATUS = 'ff-form-valid';
const FORM_INVALID_STATUS = 'ff-form-invalid';

const FORM_SUBMITTING_STATUS = 'ff-form-submitting';
const FORM_POSITIVE_SUBMIT_STATUS = 'ff-form-positive-submit';
const FORM_NEGATIVE_SUBMIT_STATUS = 'ff-form-negative-submit';

const NOOP = () => {};

const DEFAULT_OPTIONS = {
    onBeforeValidate: NOOP,
    validate: NOOP,
    onAfterValidate: NOOP,
    onValidationError: NOOP,
    onBeforeSubmit: NOOP,
    onAfterSubmit: NOOP,
    onAfterPositiveSubmit: NOOP,
    onAfterNegativeSubmit: NOOP,
    onSubmissionError: NOOP,
    onResetStatus: NOOP,
    setStatus: NOOP,
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
                validationCacheEnabled: field.hasOption('validationCacheEnabled')
                    ? this.getOption('validationCacheEnabled')
                    : options.validationCacheEnabled,
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
                onValidationError: field.hasOption('onValidationError')
                    ? field.getOption('onValidationError')
                    : options.onFieldValidationError,
                onResetStatus: field.hasOption('onResetStatus')
                    ? field.getOption('onResetStatus')
                    : options.onResetFieldStatus,
                setStatus: field.hasOption('setStatus')
                    ? field.getOption('setStatus')
                    : options.setFieldStatus,
            });
        }
    }

    /**
     * @public
     */
    listen() {
        this.formElement.addEventListener('change', () => {
            this.setStatus('');
        });
        this.formElement.addEventListener('keyup', () => {
            this.setStatus('');
        });
        this.formElement.addEventListener('submit', this.onSubmitForm.bind(this));

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            field.listen();
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

        await ignoreRejects(async () => {
            const validationResults = await this.validate();

            const isValid = ValidationResult.areValid(validationResults);

            if (!isValid) {
                return;
            }

            await this.runSubmitProcess();
        });
    }

    /**
     * @public
     *
     * @returns {Promise<ValidationResult[]>}
     */
    async validate() {
        if (
            this.fields.every((field) => field.validators.length === 0) &&
            !this.hasOption('validate')
        ) {
            return [];
        }

        this.getOption('onBeforeValidate')(this.formElement);

        this.setStatus(FORM_VALIDATING_STATUS);

        const actionId = startAction(this);

        let validationResults = [];

        try {
            validationResults = await Promise.all(
                this.getAllFields().map((field) => field.validate()),
            );
            const formValidationResult =
                this.hasOption('validate') && ValidationResult.areValid(validationResults)
                    ? await this.getOption('validate')(this.getData())
                    : ValidationResult.make(ValidationResult.areValid(validationResults));
            validationResults.push(formValidationResult);
        } catch (error) {
            finishAction(this, actionId);
            this.setStatus('');
            this.getOption('onValidationError')(error, this.formElement);
            throw error;
        }

        finishAction(this, actionId);

        const isValid = ValidationResult.areValid(validationResults);

        this.setStatus(isValid ? FORM_VALID_STATUS : FORM_INVALID_STATUS);

        this.getOption('onAfterValidate')(validationResults, this.formElement);

        return validationResults;
    }

    /**
     * @private
     *
     * @returns {Promise<void>}
     */
    async runSubmitProcess() {
        const data = this.getData();

        this.getOption('onBeforeSubmit')(data, this.formElement);

        const actionId = startAction(this);

        this.setStatus(FORM_SUBMITTING_STATUS);

        let submissionResult;

        try {
            submissionResult = await this.submit(data);
        } catch (error) {
            finishAction(this, actionId);
            this.setStatus(FORM_VALID_STATUS);
            this.getOption('onSubmissionError')(error, this.formElement);
            throw error;
        }

        finishAction(this, actionId);

        this.getOption('onAfterSubmit')(submissionResult, this.formElement);

        if (submissionResult.isPositive()) {
            this.setStatus(FORM_POSITIVE_SUBMIT_STATUS);
            this.getOption('onAfterPositiveSubmit')(submissionResult.getData(), this.formElement);
        } else {
            this.setStatus(FORM_NEGATIVE_SUBMIT_STATUS);
            this.getOption('onAfterNegativeSubmit')(submissionResult.getData(), this.formElement);
        }
    }

    getData() {
        return new FormData(this.formElement);
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

    setStatus(status) {
        if (status === '') {
            this.getOption('onResetStatus')(this.formElement);
        }

        if (this.hasOption('setStatus')) {
            this.getOption('setStatus')(this.formElement, status);
            return;
        }

        this.formElement.classList.remove(
            FORM_VALIDATING_STATUS,
            FORM_VALID_STATUS,
            FORM_INVALID_STATUS,
            FORM_SUBMITTING_STATUS,
            FORM_POSITIVE_SUBMIT_STATUS,
            FORM_NEGATIVE_SUBMIT_STATUS,
        );
        if (status !== '') {
            this.formElement.classList.add(status);
        }
    }
}
