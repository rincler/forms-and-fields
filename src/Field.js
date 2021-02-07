import validator from 'validator';
import ValidationResult from './ValidationResult';

const FIELD_VALIDATING_CSS_CLASS = 'f-field-validating';
const FIELD_VALID_CSS_CLASS = 'f-field-valid';
const FIELD_INVALID_CSS_CLASS = 'f-field-invalid';

const FIELD_CONTAINER_CSS_CLASS = 'js-f-field-container';

const DEFAULT_TYPING_DELAY = 1000;
const DEFAULT_ERROR_MESSAGE = 'Invalid value.';

export default class Field {
    /**
     * @public
     *
     * @param {string} fieldSelector
     * @param {object} validators
     * @param {object} options
     */
    constructor(fieldSelector, validators, options = {}) {
        this.fieldSelector = fieldSelector;
        this.rootElement = options.formElement || document;

        this.fieldElement = this.rootElement.querySelector(fieldSelector);

        if (!this.fieldElement) {
            throw new Error(`Field element with "${this.fieldSelector}" selector not found.`);
        }

        if (this.fieldElement.parentElement.classList.contains(FIELD_CONTAINER_CSS_CLASS)) {
            this.fieldContainerElement = this.fieldElement.parentElement;
        }

        this.validators = validators;
        this.validationResult = null;
        this.initOptions(options);
    }

    /**
     * @public
     *
     * @param {object} options
     */
    setOptions(options) {
        this.rootElement = options.formElement || document;

        this.fieldElement = this.rootElement.querySelector(this.fieldSelector);

        if (!this.fieldElement) {
            throw new Error(`Field element with "${this.fieldSelector}" selector not found.`);
        }

        this.formElement = options.formElement || this.formElement;
        this.validMessage = options.validMessage || this.validMessage;
        this.invalidMessages = options.invalidMessages || this.invalidMessages;
        this.defaultInvalidMessage = options.defaultInvalidMessage || this.defaultInvalidMessage;
        this.validateOnChange =
            options.validateOnChange !== undefined ? options.validateOnChange : this.validateOnChange;
        this.validateOnType = options.validateOnType !== undefined ? options.validateOnType : this.validateOnType;
        this.typingDelay = options.typingDelay || this.typingDelay;
        this.onTypingStart = options.onTypingStart || this.onTypingStart;
        this.onTypingEnd = options.onTypingEnd || this.onTypingEnd;
        this.onChange = options.onChange || this.onChange;
        this.validatorParams = options.validatorParams || this.validatorParams;
        this.trimEnabled = options.trimEnabled !== undefined ? options.trimEnabled : this.trimEnabled;
        this.onBeforeValidate = options.onBeforeValidate || this.onBeforeValidate;
        this.onAfterValidate = options.onAfterValidate || this.onAfterValidate;
    }

    /**
     * @public
     */
    listen() {
        if (this.isRadio()) {
            this.getRadioElements().forEach((radioElement) => {
                radioElement.addEventListener('change', this.onChangeListener.bind(this));
            });

            return;
        }

        this.fieldElement.addEventListener('change', this.onChangeListener.bind(this));
        this.fieldElement.addEventListener('keyup', this.onKeyUpListener.bind(this));
    }

    /**
     * @public
     *
     * @param {boolean} force
     *
     * @returns {Promise<boolean>}
     */
    async isValid(force = false) {
        if (!force && this.validationResult !== null) {
            return this.validationResult.isValid();
        }

        for (const validatorItem of this.validators) {
            const validatorFn = this.getValidatorFnByValidatorItem(validatorItem);
            const validationResult = await validatorFn(this.getValue());

            if (!validationResult.isValid()) {
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
        this.clearCss();

        if (this.onBeforeValidate) {
            this.onBeforeValidate(this.fieldElement, this.formElement);
        }

        this.addCss(FIELD_VALIDATING_CSS_CLASS);

        this.validationResult = new ValidationResult(true, this.validMessage);

        for (const validatorItem of this.validators) {
            const validatorFn = this.getValidatorFnByValidatorItem(validatorItem);
            this.validationResult = await validatorFn(this.getValue());

            if (!this.validationResult.isValid()) {
                break;
            }
        }

        this.clearCss();

        if (!this.validationResult.isValid() && !this.validationResult.hasMessage()) {
            this.validationResult.setMessage(this.defaultInvalidMessage);
        }

        const cssClass = this.validationResult.isValid() ? FIELD_VALID_CSS_CLASS : FIELD_INVALID_CSS_CLASS;
        this.addCss(cssClass);

        if (this.onAfterValidate) {
            this.onAfterValidate(this.validationResult, this.fieldElement, this.formElement);
        }
    }

    /**
     * @private
     *
     * @returns {string}
     */
    getValue() {
        if (this.isCheckbox()) {
            return this.fieldElement.checked;
        }

        if (this.isRadio()) {
            const checkedElement = this.getCheckedRadioElement();

            return checkedElement ? checkedElement.value : null;
        }

        if (this.isMultipleSelect()) {
            const checkedElements = this.getCheckedSelectElements();

            return Array.from(checkedElements).map((element) => element.value);
        }

        return this.fieldElement.value;
    }

    /**
     * @private
     *
     * @param {object} options
     */
    initOptions(options) {
        this.formElement = options.formElement || null;
        this.validMessage = options.validMessage || '';
        this.invalidMessages = options.invalidMessages || {};
        this.defaultInvalidMessage = options.defaultInvalidMessage || DEFAULT_ERROR_MESSAGE;
        this.validateOnChange = options.validateOnChange !== undefined ? options.validateOnChange : false;
        this.validateOnType = options.validateOnType !== undefined ? options.validateOnType : false;
        this.typingDelay = options.typingDelay || DEFAULT_TYPING_DELAY;
        this.onTypingStart = options.onTypingStart || null;
        this.onTypingEnd = options.onTypingEnd || null;
        this.onChange = options.onChange || null;
        this.validatorParams = options.validatorParams || {};
        this.trimEnabled = options.trimEnabled !== undefined ? options.trimEnabled : true;
        this.onBeforeValidate = options.onBeforeValidate || null;
        this.onAfterValidate = options.onAfterValidate || null;
    }

    /**
     * @private
     *
     * @param {string|function} validatorItem
     *
     * @returns {function}
     */
    getValidatorFnByValidatorItem(validatorItem) {
        if (validatorItem === 'required') {
            return (value) => {
                const isValid = !this.isEmpty(value);

                return new ValidationResult(
                    isValid,
                    isValid ? this.validMessage : this.invalidMessages.required || this.defaultInvalidMessage
                );
            };
        }

        if (typeof validatorItem === 'string') {
            return (value) => {
                const params = this.getValidatorParamsByValidatorName(validatorItem);
                const validatorFn = validator[validatorItem];
                const isValid = validatorFn(value, ...params);

                return new ValidationResult(
                    isValid,
                    isValid ? this.validMessage : this.getErrorMessageByValidatorName(validatorItem)
                );
            };
        }

        if (typeof validatorItem === 'function') {
            return validatorItem;
        }

        throw new Error('Invalid validator item.');
    }

    /**
     * @private
     *
     * @param {string} validatorName
     *
     * @returns {object}
     */
    getValidatorParamsByValidatorName(validatorName) {
        if (this.validatorParams && this.validatorParams[validatorName]) {
            return this.validatorParams[validatorName];
        }

        return [];
    }

    /**
     * @private
     *
     * @param {string} validatorName
     *
     * @returns {string}
     */
    getErrorMessageByValidatorName(validatorName) {
        return this.invalidMessages[validatorName] || this.defaultInvalidMessage;
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    trimAllowed() {
        return this.isText() || this.isTextarea();
    }

    /**
     * @private
     *
     * @param {object} e
     */
    onChangeListener(e) {
        if (this.trimEnabled && this.trimAllowed()) {
            e.target.value = e.target.value.trim();
        }

        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
        }

        if (this.onTypingEnd) {
            this.onTypingEnd(value, this.fieldElement, this.formElement);
        }

        if (this.onChange) {
            this.onChange(value, this.fieldElement, this.formElement);
        }

        if (this.validateOnChange || this.validateOnType) {
            this.validate();
        }
    }

    /**
     * @private
     *
     * @param {object} e
     */
    onKeyUpListener(e) {
        if (!this.typingDelayId && this.onTypingStart) {
            this.onTypingStart(this.getValue(), this.fieldElement, this.formElement);
        }

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
        }

        this.typingDelayId = setTimeout(() => {
            this.typingDelayId = null;

            if (this.trimEnabled && this.trimAllowed()) {
                e.target.value = e.target.value.trim();
            }

            if (this.onTypingEnd) {
                this.onTypingEnd(this.getValue(), this.fieldElement, this.formElement);
            }

            if (this.validateOnType) {
                this.validate();
            }
        }, this.typingDelay);
    }

    /**
     * @private
     *
     * @returns {NodeListOf<Element>}
     */
    getRadioElements() {
        if (!this.isRadio()) {
            return [];
        }

        return this.rootElement.querySelectorAll(`[name=${this.fieldElement.name}]`);
    }

    /**
     * @private
     *
     * @returns {Element|null}
     */
    getCheckedRadioElement() {
        if (!this.isRadio()) {
            return null;
        }

        return this.rootElement.querySelector(`[name=${this.fieldElement.name}]:checked`);
    }

    /**
     * @private
     *
     * @returns {NodeListOf<Element>}
     */
    getCheckedSelectElements() {
        if (!this.isMultipleSelect()) {
            return [];
        }

        return this.fieldElement.querySelectorAll('option:checked');
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isText() {
        return this.fieldElement.type === 'text';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isTextarea() {
        return this.fieldElement.type === 'textarea';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isCheckbox() {
        return this.fieldElement.type === 'checkbox';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isRadio() {
        return this.fieldElement.type === 'radio';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isMultipleSelect() {
        return this.fieldElement.type === 'select-multiple';
    }

    /**
     * @private
     *
     * @param {string|boolean|object} value
     *
     * @returns {boolean}
     */
    isEmpty(value) {
        if (this.isCheckbox()) {
            return value === false;
        }

        if (this.isRadio()) {
            return value === null;
        }

        if (this.isMultipleSelect()) {
            return value.length === 0;
        }

        return value === '';
    }

    /**
     * @private
     */
    clearCss() {
        const element = this.fieldContainerElement || this.fieldElement;
        element.classList.remove(FIELD_VALIDATING_CSS_CLASS, FIELD_VALID_CSS_CLASS, FIELD_INVALID_CSS_CLASS);
    }

    /**
     * @private
     *
     * @param {string} cssClass
     */
    addCss(cssClass) {
        const element = this.fieldContainerElement || this.fieldElement;
        element.classList.add(cssClass);
    }
}
