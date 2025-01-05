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
    trimEnabled: true,
    typingDelay: 1000,
    validateOnChange: false,
    validateOnType: false,
    validatorParams: {},
    onChange: NOOP,
    onTypingStart: NOOP,
    onTypingEnd: NOOP,
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
};

const virtualFieldsCache = {};

export default class Field {
    /**
     * @public
     *
     * @param {string} fieldSelector
     * @param {string} rootSelector
     * @param {array} validators
     * @param {object} options
     */
    constructor(fieldSelector, rootSelector, validators = [], options = {}) {
        this.rootElement = document.querySelector(rootSelector);

        if (!this.rootElement) {
            throw new Error(`Root element with the "${rootSelector}" selector not found.`);
        }

        this.fieldSelector = fieldSelector;
        this.rootSelector = rootSelector;

        this.formElement =
            this.rootElement.tagName === 'FORM' ? this.rootElement : this.rootElement.querySelector('form');

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
        // eslint-disable-next-line no-restricted-syntax
        for (const name of Object.keys(options)) {
            if (name in DEFAULT_OPTIONS && options[name] !== undefined) {
                this.options[name] = options[name];
            }
        }
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
        this.addEventListenerDelegatedToRootElement('change', this.onChangeListener, this.fieldSelector);
        this.addEventListenerDelegatedToRootElement('keyup', this.onKeyUpListener, this.fieldSelector);
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

        const fieldElement = this.getFieldElement();

        this.clearCss();

        this.getOption('onBeforeValidate')(fieldElement, this.formElement);

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

        this.getOption('onAfterValidate')(this.validationResult, fieldElement, this.formElement);
    }

    /**
     * @public
     *
     * @returns {string|string[]|boolean|null|FileList}
     */
    getValue() {
        const fieldElement = this.getFieldElement();

        if (this.getOption('trimEnabled') && this.trimAllowed()) {
            fieldElement.value = fieldElement.value.trim();
        }

        if (this.isCheckbox()) {
            return fieldElement.checked;
        }

        if (this.isRadio()) {
            const checkedElement = this.getCheckedRadioElement();

            return checkedElement ? checkedElement.value : null;
        }

        if (this.isMultipleSelect()) {
            const checkedElements = this.getCheckedSelectElements();

            return Array.from(checkedElements).map((element) => element.value);
        }

        if (this.isFile()) {
            return fieldElement.files;
        }

        return fieldElement.value;
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    exists() {
        return this.rootElement.querySelector(this.fieldSelector) !== null;
    }

    /**
     * @private
     *
     * @returns {Element}
     */
    getFieldElement = () => {
        const fieldElement = this.rootElement.querySelector(this.fieldSelector);
        if (!fieldElement) {
            throw new Error(`Field element with the "${this.fieldSelector}" selector not found.`);
        }

        return fieldElement;
    };

    /**
     * @private
     *
     * @returns {Element|null}
     */
    getFieldContainerElement = () => {
        const fieldElement = this.getFieldElement();
        return fieldElement.parentElement.classList.contains(FIELD_CONTAINER_CSS_CLASS)
            ? fieldElement.parentElement
            : null;
    };

    /**
     * @private
     */
    addEventListenerDelegatedToRootElement(type, listener, selector) {
        this.rootElement.addEventListener(type, (event) => {
            const { target } = event;

            if (target.classList.contains(selector.substring(1))) {
                let field = this;
                if (this.isList()) {
                    const listElementsExceptFirst = this.getListElementsExceptFirst();
                    const notFirstListElement = listElementsExceptFirst.find((e) => e.isSameNode(target));
                    if (notFirstListElement) {
                        field = this.getVirtualFieldForElement(notFirstListElement);
                    }
                }

                listener.call(field, target);
            }
        });
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
            return validatorItem;
        }

        if (typeof validatorItem === 'object' && typeof validatorItem.validate === 'function') {
            return (value) => {
                return validatorItem.validate(value);
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
        const fieldElement = this.getFieldElement();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
            this.getOption('onTypingEnd')(value, fieldElement, this.formElement);
            this.getOption('onChange')(value, fieldElement, this.formElement);
            if (this.getOption('validateOnType') || this.getOption('validateOnChange')) {
                this.validate();
            }
            return;
        }

        this.getOption('onChange')(value, fieldElement, this.formElement);
        if (this.getOption('validateOnChange')) {
            this.validate();
        }
    }

    /**
     * @private
     */
    async onKeyUpListener() {
        const value = this.getValue();
        const fieldElement = this.getFieldElement();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
        } else {
            this.getOption('onTypingStart')(value, fieldElement, this.formElement);
        }

        this.typingDelayId = setTimeout(() => {
            this.typingDelayId = null;

            this.getOption('onTypingEnd')(value, fieldElement, this.formElement);

            if (this.getOption('validateOnType')) {
                this.validate();
            }
        }, this.getOption('typingDelay'));
    }

    /**
     * @private
     *
     * @returns {Element[]}
     */
    getListElementsExceptFirst() {
        return Array.from(this.rootElement.querySelectorAll(this.fieldSelector)).slice(1);
    }

    /**
     * @private
     *
     * @returns {Field[]}
     */
    getVirtualFieldsOfList() {
        return this.getListElementsExceptFirst().map((listElement) => this.getVirtualFieldForElement(listElement));
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

        return this.rootElement.querySelector(`[name=${this.getFieldElement().name}]:checked`);
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

        return this.getFieldElement().querySelectorAll('option:checked');
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isText() {
        return this.getFieldElement().type === 'text';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isList() {
        return this.rootElement.querySelectorAll(this.fieldSelector).length > 1;
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isTextarea() {
        return this.getFieldElement().type === 'textarea';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isCheckbox() {
        return this.getFieldElement().type === 'checkbox';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isRadio() {
        return this.getFieldElement().type === 'radio';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isMultipleSelect() {
        return this.getFieldElement().type === 'select-multiple';
    }

    /**
     * @private
     *
     * @returns {boolean}
     */
    isFile() {
        return this.getFieldElement().type === 'file';
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

        if (this.isMultipleSelect() || this.isFile()) {
            return value.length === 0;
        }

        return value === '';
    }

    /**
     * @private
     */
    clearCss() {
        const element = this.getFieldContainerElement() || this.getFieldElement();
        element.classList.remove(FIELD_VALIDATING_CSS_CLASS, FIELD_VALID_CSS_CLASS, FIELD_INVALID_CSS_CLASS);
    }

    /**
     * @private
     *
     * @param {string} cssClass
     */
    addCss(cssClass) {
        const element = this.getFieldContainerElement() || this.getFieldElement();
        element.classList.add(cssClass);
    }

    getInvalidErrorMessage(invalidErrorMessage) {
        return invalidErrorMessage || this.getOption('defaultInvalidMessage');
    }

    /**
     * @private
     */
    getVirtualFieldForElement(element) {
        if (element.dataset.fieldId && virtualFieldsCache[element.dataset.fieldId]) {
            return virtualFieldsCache[element.dataset.fieldId];
        }

        const fieldId = Math.random().toString(36).substring(2);
        // eslint-disable-next-line no-param-reassign
        element.dataset.fieldId = fieldId;
        const field = new Field(
            `${this.fieldSelector}[data-field-id="${fieldId}"]`,
            this.rootSelector,
            this.validators,
            this.options
        );
        virtualFieldsCache[element.dataset.fieldId] = field;

        return field;
    }
}
