import validator from 'validator';
import ValidationResult from './ValidationResult';
import { ignoreRejects, startAction, finishAction } from './Reject';

const FIELD_VALIDATING_STATUS = 'ff-field-validating';
const FIELD_VALID_STATUS = 'ff-field-valid';
const FIELD_INVALID_STATUS = 'ff-field-invalid';

const NOOP = () => {};

const DEFAULT_OPTIONS = {
    invalidMessages: {},
    defaultInvalidMessage: 'Invalid value.',
    trimEnabled: true,
    typingDelay: 1000,
    validateOnChange: false,
    validateOnType: false,
    validatorParams: {},
    validationCacheEnabled: true,
    onChange: NOOP,
    onTypingStart: NOOP,
    onTypingEnd: NOOP,
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
    onValidationError: NOOP,
    onResetStatus: NOOP,
    setStatus: NOOP,
};

export default class Field {
    /**
     * @public
     *
     * @constructor
     *
     * @param {string} fieldSelector
     * @param {string} containerSelector
     * @param {array} validators
     * @param {object} options
     */
    constructor(fieldSelector, containerSelector, validators, options = {}) {
        this.containerElement = document.querySelector(containerSelector);

        if (!this.containerElement) {
            throw new Error(
                `Container element with the "${containerSelector}" selector not found.`,
            );
        }

        this.fieldSelector = fieldSelector;
        this.containerSelector = containerSelector;

        this.validators = validators;
        this.validationResult = null;
        this.virtualFieldsCache = {};

        this.options = {};
        this.setOptions(options);
    }

    /**
     * @public
     */
    listen() {
        this.addEventListenerDelegatedToContainerElement(
            'change',
            this.onChangeListener,
            this.fieldSelector,
        );
        this.addEventListenerDelegatedToContainerElement(
            'keyup',
            this.onKeyUpListener,
            this.fieldSelector,
        );
    }

    /**
     * @private
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
     * @private
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
     * @param {boolean} force
     *
     * @returns {Promise<ValidationResult>}
     */
    async validate(force = false) {
        if (this.getOption('validationCacheEnabled') && this.validationResult !== null && !force) {
            return this.validationResult;
        }

        if (this.validators.length === 0) {
            this.validationResult = ValidationResult.valid();
            return ValidationResult.valid();
        }

        const fieldElement = this.getFieldElement();

        this.getOption('onBeforeValidate')(fieldElement, this.containerElement);

        const actionId = startAction(this);

        this.setStatus(FIELD_VALIDATING_STATUS);

        const value = this.getValue();

        let validationResult;

        // eslint-disable-next-line no-restricted-syntax
        for (const validatorItem of this.validators) {
            const validatorFn = this.getValidatorFnByValidatorItem(validatorItem);
            try {
                // eslint-disable-next-line no-await-in-loop
                validationResult = await validatorFn(value);
            } catch (error) {
                finishAction(this, actionId);
                this.setStatus('');
                this.getOption('onValidationError')(error, fieldElement, this.containerElement);
                throw error;
            }

            if (!validationResult.isValid()) {
                break;
            }
        }

        finishAction(this, actionId);

        this.validationResult = validationResult;

        if (!this.validationResult.isValid() && !this.validationResult.hasMessage()) {
            this.validationResult = ValidationResult.invalid(
                this.getOption('defaultInvalidMessage'),
            );
        }

        this.setStatus(this.validationResult.isValid() ? FIELD_VALID_STATUS : FIELD_INVALID_STATUS);

        this.getOption('onAfterValidate')(
            this.validationResult,
            fieldElement,
            this.containerElement,
        );

        return this.validationResult;
    }

    /**
     * @private
     *
     * @returns {string|string[]|boolean|null|FileList}
     */
    getValue() {
        const fieldElement = this.getFieldElement();

        if (this.getOption('trimEnabled') && this.trimAllowed()) {
            fieldElement.value = fieldElement.value.trim();
        }

        if (this.isText() || this.isTextarea()) {
            return fieldElement.value;
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
        return this.containerElement.querySelector(this.fieldSelector) !== null;
    }

    /**
     * @private
     *
     * @returns {Element}
     */
    getFieldElement() {
        const fieldElement = this.containerElement.querySelector(this.fieldSelector);
        if (!fieldElement) {
            throw new Error(`Field element with the "${this.fieldSelector}" selector not found.`);
        }

        return fieldElement;
    }

    /**
     * @private
     *
     * @returns {Element|null}
     */
    getFieldWrapperElement() {
        const fieldElement = this.getFieldElement();
        return 'fieldWrapper' in fieldElement.parentElement.dataset
            ? fieldElement.parentElement
            : null;
    }

    /**
     * @private
     *
     * @param {string} type
     * @param {function} listener
     * @param {string} selector
     */
    addEventListenerDelegatedToContainerElement(type, listener, selector) {
        this.containerElement.addEventListener(type, (event) => {
            const target = event.target;

            if (target.classList.contains(selector.substring(1))) {
                let field = this;
                if (this.isList()) {
                    const virtualFields = this.getVirtualFieldsOfList();
                    field = virtualFields[this.findElementIndexInList(target)];
                }

                listener.call(field, target);
            }
        });
    }

    /**
     * @private
     *
     * @param {string|function|object} validatorItem
     *
     * @returns {function}
     */
    getValidatorFnByValidatorItem(validatorItem) {
        if (validatorItem === 'required') {
            return (value) => {
                const isValid = !this.isEmpty(value);

                return ValidationResult.make(isValid, this.getInvalidErrorMessage('required'));
            };
        }

        if (typeof validatorItem === 'string') {
            return (value) => {
                const params = this.getOption('validatorParams')[validatorItem] || [];
                const validatorFn = validator[validatorItem];
                const isValid = value === '' || validatorFn(value, ...params);

                return ValidationResult.make(isValid, this.getInvalidErrorMessage(validatorItem));
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
     *
     * @param {Element} fieldElement
     */
    async onChangeListener(fieldElement) {
        this.validationResult = null;
        this.setStatus('');

        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
            this.getOption('onTypingEnd')(value, fieldElement, this.containerElement);
            this.getOption('onChange')(value, fieldElement, this.containerElement);
            if (this.getOption('validateOnType') || this.getOption('validateOnChange')) {
                await ignoreRejects(async () => {
                    await this.validate();
                });
            }
            return;
        }

        this.getOption('onChange')(value, fieldElement, this.containerElement);
        if (this.getOption('validateOnChange')) {
            await ignoreRejects(async () => {
                await this.validate();
            });
        }
    }

    /**
     * @private
     *
     * @param {Element} fieldElement
     */
    async onKeyUpListener(fieldElement) {
        this.validationResult = null;
        this.setStatus('');
        if (this.getOption('validateOnType')) {
            // This fixes the next case:
            // start typing -> result of the previous validation ->  finish typing -> validate
            // It will ignore "result of the previous validation".
            startAction(this);
        }

        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
        } else {
            this.getOption('onTypingStart')(value, fieldElement, this.containerElement);
        }

        this.typingDelayId = setTimeout(async () => {
            this.typingDelayId = null;

            this.getOption('onTypingEnd')(value, fieldElement, this.containerElement);

            if (this.getOption('validateOnType')) {
                await ignoreRejects(async () => {
                    await this.validate();
                });
            }
        }, this.getOption('typingDelay'));
    }

    /**
     * @private
     *
     * @returns {Element[]}
     */
    getListElements() {
        return Array.from(this.containerElement.querySelectorAll(this.fieldSelector));
    }

    /**
     * @private
     *
     * @param {Element} element
     */
    findElementIndexInList(element) {
        return this.getListElements().findIndex((e) => e.isSameNode(element));
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

        return this.containerElement.querySelector(`[name=${this.getFieldElement().name}]:checked`);
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
        if ('fieldId' in this.getFieldElement().dataset) {
            return true;
        }

        return (
            this.containerElement.querySelectorAll(this.fieldSelector).length > 1 && !this.isRadio()
        );
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
     * @param {string|string[]|boolean|null|FileList} value
     *
     * @returns {boolean}
     */
    isEmpty(value) {
        if (this.isText() || this.isTextarea()) {
            return value === '';
        }

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
     *
     * @param {string} validatorName
     *
     * @returns {string}
     */
    getInvalidErrorMessage(validatorName) {
        return (
            this.getOption('invalidMessages')[validatorName] ||
            this.getOption('defaultInvalidMessage')
        );
    }

    /**
     * @private
     *
     * @returns {Field[]}
     */
    getVirtualFieldsOfList() {
        return this.getListElements().map((listElement) =>
            this.getVirtualFieldForElement(listElement),
        );
    }

    /**
     * @private
     *
     * @param {Element} element
     */
    getVirtualFieldForElement(element) {
        if (!element.dataset.fieldId) {
            // eslint-disable-next-line no-param-reassign
            element.dataset.fieldId = Math.random().toString(36).substring(2);
        }

        if (this.virtualFieldsCache[element.dataset.fieldId]) {
            return this.virtualFieldsCache[element.dataset.fieldId];
        }

        const field = new Field(
            `${this.fieldSelector}[data-field-id="${element.dataset.fieldId}"]`,
            this.containerSelector,
            this.validators,
            this.options,
        );
        this.virtualFieldsCache[element.dataset.fieldId] = field;

        return field;
    }

    /**
     * @private
     *
     * @param {string} status
     */
    setStatus(status) {
        const fieldElement = this.getFieldElement();
        const wrapperElement = this.getFieldWrapperElement();

        if (status === '') {
            this.getOption('onResetStatus')(fieldElement, wrapperElement);
        }

        if (this.hasOption('setStatus')) {
            this.getOption('setStatus')(fieldElement, status, wrapperElement);
            return;
        }

        const element = wrapperElement || fieldElement;

        element.classList.remove(FIELD_VALIDATING_STATUS, FIELD_VALID_STATUS, FIELD_INVALID_STATUS);
        if (status !== '') {
            element.classList.add(status);
        }
    }
}
