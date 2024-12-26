import validator from 'validator';
import ValidationResult from './ValidationResult';

const FIELD_VALIDATING_CSS_CLASS = 'f-field-validating';
const FIELD_VALID_CSS_CLASS = 'f-field-valid';
const FIELD_INVALID_CSS_CLASS = 'f-field-invalid';

const FIELD_CONTAINER_CSS_CLASS = 'js-f-field-container';

const NOOP = () => {};

const DEFAULT_OPTIONS = {
    validMessage: '',
    invalidMessages: {},
    defaultInvalidMessage: 'Invalid value.',
    validateOnChange: false,
    validateOnType: false,
    typingDelay: 1000,
    onTypingStart: NOOP,
    onTypingEnd: NOOP,
    onChange: NOOP,
    validatorParams: {},
    trimEnabled: true,
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
};

export default class Field {
    /**
     * @public
     *
     * @param {string} fieldSelector
     * @param {string} formSelector
     * @param {array} validators
     * @param {object} options
     */
    constructor(fieldSelector, formSelector = undefined, validators = [], options = {}) {
        if (formSelector) {
            this.formElement = document.querySelector(formSelector);

            if (!this.formElement) {
                throw new Error(`Form element with the "${formSelector}" selector not found.`);
            }
        } else {
            this.formElement = null;
        }

        this.rootElement = this.formElement || document;
        this.fieldElement = this.rootElement.querySelector(fieldSelector);

        if (!this.fieldElement) {
            throw new Error(`Field element with the "${fieldSelector}" selector not found.`);
        }

        if (this.fieldElement.parentElement.classList.contains(FIELD_CONTAINER_CSS_CLASS)) {
            this.fieldContainerElement = this.fieldElement.parentElement;
        }

        this.validators = validators;
        this.validationResult = null;

        this.options = {};
        this.setOptions(options);
    }

    /**
     * @public
     *
     * @param {object} options
     */
    setOptions(options) {
        this.options = {
            ...this.options,
            ...options,
        };
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

        const value = this.getValue();

        // eslint-disable-next-line no-restricted-syntax
        for (const validatorItem of this.validators) {
            const validatorFn = this.getValidatorFnByValidatorItem(validatorItem);
            // eslint-disable-next-line no-await-in-loop
            const validationResult = await validatorFn(value);

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
        if (this.validators.length === 0) {
            return;
        }

        this.clearCss();

        this.getOption('onBeforeValidate')(this.fieldElement, this.formElement);

        this.addCss(FIELD_VALIDATING_CSS_CLASS);

        this.validationResult = new ValidationResult(true, this.getOption('validMessage'));
        const value = this.getValue();

        // eslint-disable-next-line no-restricted-syntax
        for (const validatorItem of this.validators) {
            const validatorFn = this.getValidatorFnByValidatorItem(validatorItem);
            // eslint-disable-next-line no-await-in-loop
            this.validationResult = await validatorFn(value);

            if (!this.validationResult.isValid()) {
                break;
            }
        }

        this.clearCss();

        if (!this.validationResult.isValid() && !this.validationResult.hasMessage()) {
            this.validationResult.setMessage(this.getOption('defaultInvalidMessage'));
        }

        const cssClass = this.validationResult.isValid() ? FIELD_VALID_CSS_CLASS : FIELD_INVALID_CSS_CLASS;
        this.addCss(cssClass);

        this.getOption('onAfterValidate')(this.validationResult, this.fieldElement, this.formElement);
    }

    /**
     * @public
     *
     * @returns {string|string[]|boolean|null}
     */
    getValue() {
        if (this.getOption('trimEnabled') && this.trimAllowed()) {
            this.fieldElement.value = this.fieldElement.value.trim();
        }

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
                    isValid
                        ? this.getOption('validMessage')
                        : this.getInvalidErrorMessage(this.getOption('invalidMessages').required)
                );
            };
        }

        if (typeof validatorItem === 'string') {
            return (value) => {
                const params = this.getOption('validatorParams')[validatorItem] || [];
                const validatorFn = validator[validatorItem];
                const isValid = value === '' || validatorFn(value, ...params);

                return new ValidationResult(
                    isValid,
                    isValid
                        ? this.validMessage
                        : this.getInvalidErrorMessage(this.getOption('invalidMessages')[validatorItem])
                );
            };
        }

        if (typeof validatorItem === 'function') {
            return (value) => {
                if (value === '') {
                    return new ValidationResult(true, this.getOption('validMessage'));
                }

                return validatorItem(value);
            };
        }

        throw new Error('Invalid validator item.');
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
     */
    onChangeListener() {
        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
            this.getOption('onTypingEnd')(value, this.fieldElement, this.formElement);
            this.getOption('onChange')(value, this.fieldElement, this.formElement);
            if (this.getOption('validateOnType') || this.getOption('validateOnChange')) {
                this.validate();
            }
            return;
        }

        this.getOption('onChange')(value, this.fieldElement, this.formElement);
        if (this.getOption('validateOnChange')) {
            this.validate();
        }
    }

    /**
     * @private
     */
    onKeyUpListener() {
        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
        } else {
            this.getOption('onTypingStart')(value, this.fieldElement, this.formElement);
        }

        this.typingDelayId = setTimeout(() => {
            this.typingDelayId = null;

            this.getOption('onTypingEnd')(value, this.fieldElement, this.formElement);

            if (this.getOption('validateOnType')) {
                this.validate();
            }
        }, this.getOption('typingDelay'));
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

    getInvalidErrorMessage(invalidErrorMessage) {
        return invalidErrorMessage || this.getOption('defaultInvalidMessage');
    }
}
