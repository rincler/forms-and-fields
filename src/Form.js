import SubmissionResult from './SubmissionResult';

const FORM_SUBMITTING_CSS_CLASS = 'f-form-submitting';
const FORM_SUBMIT_SUCCESS_CSS_CLASS = 'f-form-submit-success';
const FORM_SUBMIT_ERROR_CSS_CLASS = 'f-form-submit-error';

const FORM_VALIDATING_CSS_CLASS = 'f-form-validating';
const FORM_VALID_CSS_CLASS = 'f-form-valid';
const FORM_INVALID_CSS_CLASS = 'f-form-invalid';

const ACTION_VALIDATING = 'action-validating';
const ACTION_SUBMITTING = 'action-submitting';

export default class Form {
    /**
     * @public
     *
     * @param {string} formSelector
     * @param {object} fields
     * @param {object} options
     */
    constructor(formSelector, fields = [], options = {}) {
        this.formElement = document.querySelector(formSelector);

        if (!this.formElement) {
            throw new Error(`Form element with "${formSelector}" selector not found.`);
        }

        this.fields = fields;

        this.validatingAllFields = false;

        this.onBeforeValidate = options.onBeforeValidate || null;
        this.onAfterValidate = options.onAfterValidate || null;
        this.onBeforeSubmit = options.onBeforeSubmit || null;
        this.submit = options.submit || null;
        this.onAfterSubmit = options.onAfterSubmit || null;
        this.onAfterSubmitSuccess = options.onAfterSubmitSuccess || null;
        this.onAfterSubmitError = options.onAfterSubmitError || null;

        this.initFields(options);
    }

    /**
     * @public
     */
    listen() {
        this.formElement.addEventListener('submit', this.onSubmitForm.bind(this));

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
        for (const field of this.fields) {
            const isValid = await field.isValid(force);
            if (!isValid) {
                return false;
            }
        }

        return true;
    }

    /**
     * @public
     *
     * @returns {Promise<void>}
     */
    async validate() {
        this.validatingAllFields = true;

        this.clearCss(ACTION_VALIDATING);

        if (this.onBeforeValidate) {
            this.onBeforeValidate(this.formElement);
        }

        this.addCss(FORM_VALIDATING_CSS_CLASS);

        for (const field of this.fields) {
            await field.validate();
        }

        this.clearCss(ACTION_VALIDATING);

        const isValid = await this.isValid();

        const cssClass = isValid ? FORM_VALID_CSS_CLASS : FORM_INVALID_CSS_CLASS;
        this.addCss(cssClass);

        if (this.onAfterValidate) {
            this.onAfterValidate(isValid, this.formElement);
        }

        this.validatingAllFields = false;
    }

    /**
     * @private
     *
     * @param {object} options
     */
    initFields(options) {
        for (const field of this.fields) {
            field.setOptions({
                formElement: this.formElement,
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

                    if (this.onBeforeValidate) {
                        this.onBeforeValidate(this.formElement);
                    }

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

                    if (this.onAfterValidate) {
                        this.onAfterValidate(isFormValid, this.formElement);
                    }
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

        const formData = new FormData(this.formElement);

        if (this.onBeforeSubmit) {
            this.onBeforeSubmit(formData, this.formElement);
        }

        this.clearCss(ACTION_SUBMITTING);
        this.addCss(FORM_SUBMITTING_CSS_CLASS);

        await this.validate();

        const isValid = await this.isValid();

        if (!isValid) {
            this.clearCss(ACTION_SUBMITTING);

            return;
        }

        let submissionResult = null;

        if (this.submit) {
            try {
                submissionResult = await this.submit(formData, this.formElement);
            } catch (error) {
                console.error(error);
                submissionResult = new SubmissionResult(false);
            }
        }

        this.clearCss(ACTION_SUBMITTING);

        if (this.onAfterSubmit) {
            this.onAfterSubmit(submissionResult, this.formElement);
        }

        if (submissionResult && submissionResult.isSuccess()) {
            this.addCss(FORM_SUBMIT_SUCCESS_CSS_CLASS);

            if (this.onAfterSubmitSuccess) {
                this.onAfterSubmitSuccess(submissionResult.getData(), this.formElement);
            }
        }

        if (submissionResult && !submissionResult.isSuccess()) {
            this.addCss(FORM_SUBMIT_ERROR_CSS_CLASS);

            if (this.onAfterSubmitError) {
                this.onAfterSubmitError(submissionResult.getData(), this.formElement);
            }
        }
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
