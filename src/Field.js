import validator from 'validator';
import ValidationResult from './ValidationResult';
import { ignoreRejects, startAction, finishAction } from './Reject';

const FIELD_VALIDATING_CSS_CLASS = 'ff-field-validating';
const FIELD_VALID_CSS_CLASS = 'ff-field-valid';
const FIELD_INVALID_CSS_CLASS = 'ff-field-invalid';

const FIELD_CONTAINER_CSS_CLASS = 'js-ff-field-container';

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
    onClear: NOOP,
    setCssClass: NOOP,
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
    constructor(fieldSelector, rootSelector, validators, options = {}) {
        this.rootElement = document.querySelector(rootSelector);

        if (!this.rootElement) {
            throw new Error(`Root element with the "${rootSelector}" selector not found.`);
        }

        this.fieldSelector = fieldSelector;
        this.rootSelector = rootSelector;

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
        this.addEventListenerDelegatedToRootElement(
            'change',
            this.onChangeListener,
            this.fieldSelector,
        );
        this.addEventListenerDelegatedToRootElement(
            'keyup',
            this.onKeyUpListener,
            this.fieldSelector,
        );
    }

    /**
     * @public
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

        this.getOption('onBeforeValidate')(fieldElement, this.rootElement);

        const actionId = startAction(this);

        this.setCssClass(FIELD_VALIDATING_CSS_CLASS);

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
                this.setCssClass('');
                this.getOption('onValidationError')(error, fieldElement, this.rootElement);
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

        this.setCssClass(
            this.validationResult.isValid() ? FIELD_VALID_CSS_CLASS : FIELD_INVALID_CSS_CLASS,
        );

        this.getOption('onAfterValidate')(this.validationResult, fieldElement, this.rootElement);

        return this.validationResult;
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
            const target = event.target;

            if (target.classList.contains(selector.substring(1))) {
                let field = this;
                if (this.isList()) {
                    const listElementsExceptFirst = this.getListElementsExceptFirst();
                    const notFirstListElement = listElementsExceptFirst.find((e) =>
                        e.isSameNode(target),
                    );
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
     */
    async onChangeListener(fieldElement) {
        this.validationResult = null;
        this.setCssClass('');

        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
            this.getOption('onTypingEnd')(value, fieldElement, this.rootElement);
            this.getOption('onChange')(value, fieldElement, this.rootElement);
            if (this.getOption('validateOnType') || this.getOption('validateOnChange')) {
                await ignoreRejects(async () => {
                    await this.validate();
                });
            }
            return;
        }

        this.getOption('onChange')(value, fieldElement, this.rootElement);
        if (this.getOption('validateOnChange')) {
            await ignoreRejects(async () => {
                await this.validate();
            });
        }
    }

    /**
     * @private
     */
    async onKeyUpListener(fieldElement) {
        this.validationResult = null;
        this.setCssClass('');
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
            this.getOption('onTypingStart')(value, fieldElement, this.rootElement);
        }

        this.typingDelayId = setTimeout(async () => {
            this.typingDelayId = null;

            this.getOption('onTypingEnd')(value, fieldElement, this.rootElement);

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
    getListElementsExceptFirst() {
        return Array.from(this.rootElement.querySelectorAll(this.fieldSelector)).slice(1);
    }

    /**
     * @private
     *
     * @returns {Field[]}
     */
    getVirtualFieldsOfList() {
        return this.getListElementsExceptFirst().map((listElement) =>
            this.getVirtualFieldForElement(listElement),
        );
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
        return this.rootElement.querySelectorAll(this.fieldSelector).length > 1 && !this.isRadio();
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
     */
    getVirtualFieldForElement(element) {
        if (!element.dataset.fieldId) {
            // eslint-disable-next-line no-param-reassign
            element.dataset.fieldId = Math.random().toString(36).substring(2);
        }

        if (virtualFieldsCache[element.dataset.fieldId]) {
            return virtualFieldsCache[element.dataset.fieldId];
        }

        const field = new Field(
            `${this.fieldSelector}[data-field-id="${element.dataset.fieldId}"]`,
            this.rootSelector,
            this.validators,
            this.options,
        );
        virtualFieldsCache[element.dataset.fieldId] = field;

        return field;
    }

    setCssClass(cssClass) {
        const fieldElement = this.getFieldElement();
        const containerElement = this.getFieldContainerElement();

        if (cssClass === '') {
            this.getOption('onClear')(fieldElement, containerElement);
        }

        if (this.hasOption('setCssClass')) {
            this.getOption('setCssClass')(fieldElement, cssClass, containerElement);
            return;
        }

        const element = containerElement || fieldElement;

        element.classList.remove(
            FIELD_VALIDATING_CSS_CLASS,
            FIELD_VALID_CSS_CLASS,
            FIELD_INVALID_CSS_CLASS,
        );
        if (cssClass !== '') {
            element.classList.add(cssClass);
        }
    }
}
