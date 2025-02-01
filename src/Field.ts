import validator from 'validator';
import ValidationResult from './ValidationResult';
import { ignoreRejects, startAction, finishAction } from './Reject';
import {
    FieldOptionName,
    FieldOptions,
    FieldStatus,
    FieldValue,
    ValidateFn,
    Validator,
    ValidatorName,
    ValueableElement,
    VendorValidateFn,
} from './types';

const NOOP = (): void => {};

const DEFAULT_OPTIONS: FieldOptions = {
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
    onStatusChange: NOOP,
    onStatusReset: NOOP,
};

const ALLOWED_OPTIONS = Object.keys(DEFAULT_OPTIONS);

export default class Field {
    containerElement: Element;
    fieldSelector: string;
    containerSelector: string;
    validators: Validator[];
    options: FieldOptions;
    validationResult: ValidationResult | null;
    cachedFieldElement: HTMLElement | null;
    virtualFieldsCache: { [key: string]: Field };
    actionId: number;
    typingDelayId: number | null;

    constructor(
        fieldSelector: string,
        containerSelector: string,
        validators: Validator[] = [],
        options: FieldOptions = {},
    ) {
        const containerElement = document.querySelector(containerSelector);

        if (!containerElement) {
            throw new Error(
                `A container element with the "${containerSelector}" selector not found.`,
            );
        }

        this.containerElement = containerElement;

        this.fieldSelector = fieldSelector;
        this.containerSelector = containerSelector;

        this.validators = validators;

        this.options = {};
        this.setOptions(options);

        this.validationResult = null;
        this.cachedFieldElement = null;
        this.virtualFieldsCache = {};
        this.actionId = 0;
        this.typingDelayId = null;
    }

    listen(): void {
        this.addEventListenerDelegatedToContainerElement(
            'change',
            this.onChange,
            this.fieldSelector,
        );
        this.addEventListenerDelegatedToContainerElement('keyup', this.onKeyUp, this.fieldSelector);
    }

    addEventListenerDelegatedToContainerElement(
        type: string,
        listener: EventListener,
        selector: string,
    ): void {
        this.containerElement.addEventListener(type, (event) => {
            const target = event.target;

            if (!(target instanceof HTMLElement)) {
                throw new Error('The event target is not an instance of the HTMLElement.');
            }

            if (target.classList.contains(selector.substring(1))) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                let field = this;
                if (this.isList()) {
                    const virtualFields = this.getVirtualFieldsOfList();
                    // @ts-expect-error It's ok, `this` is a `Field`.
                    field = virtualFields[this.findElementIndexInList(target)];
                }

                listener.call(field, event);
            }
        });
    }

    async onChange(event: Event): Promise<void> {
        if (!this.isTextable()) {
            this.reset();
        }

        // @ts-expect-error The `event.target` is always an `HTMLElement` here.
        const fieldElement: HTMLElement = event.target;
        const value = this.getValue();

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
            this.typingDelayId = null;
            this.getOption('onTypingEnd')(value, fieldElement, this.containerElement);
            this.getOption('onChange')(value, fieldElement, this.containerElement);
            if (this.getOption('validateOnType') || this.getOption('validateOnChange')) {
                await ignoreRejects(this.validate.bind(this));
            }
            return;
        }

        this.getOption('onChange')(value, fieldElement, this.containerElement);
        if (this.getOption('validateOnChange')) {
            await ignoreRejects(this.validate.bind(this));
        }
    }

    async onKeyUp(event: Event): Promise<void> {
        this.reset();

        // @ts-expect-error The `event.target` is always an `Element` here.
        const fieldElement: HTMLElement = event.target;

        if (this.getOption('validateOnType')) {
            // This fixes the next case:
            // start typing -> result of the previous validation ->  finish typing -> validate
            // It will ignore "result of the previous validation".
            startAction(this);
        }

        if (this.typingDelayId) {
            clearTimeout(this.typingDelayId);
        } else {
            this.getOption('onTypingStart')(fieldElement, this.containerElement);
        }

        this.typingDelayId = window.setTimeout(async () => {
            this.typingDelayId = null;

            this.getOption('onTypingEnd')(this.getValue(), fieldElement, this.containerElement);

            if (this.getOption('validateOnType')) {
                await ignoreRejects(this.validate.bind(this));
            }
        }, this.getOption('typingDelay'));
    }

    setOptions(options: FieldOptions): void {
        // eslint-disable-next-line no-restricted-syntax
        for (const name of Object.keys(options) as Array<keyof FieldOptions>) {
            if (ALLOWED_OPTIONS.includes(name) && options[name] !== undefined) {
                // @ts-expect-error The same type.
                this.options[name] = options[name];
            }
        }
    }

    getOption<Name extends FieldOptionName>(name: Name): Required<FieldOptions>[Name] {
        if (this.hasOption(name)) {
            return this.options[name] as Required<FieldOptions>[Name];
        }

        if (DEFAULT_OPTIONS[name] === undefined) {
            throw new Error(`The "${name}" field option is not set.`);
        }

        return DEFAULT_OPTIONS[name] as Required<FieldOptions>[Name];
    }

    hasOption(name: FieldOptionName): boolean {
        return this.options[name] !== undefined;
    }

    async validate(): Promise<ValidationResult> {
        if (this.getOption('validationCacheEnabled') && this.validationResult !== null) {
            return this.validationResult;
        }

        this.trim();

        if (this.validators.length === 0) {
            this.validationResult = ValidationResult.valid();
            this.setStatus(FieldStatus.Valid);
            return ValidationResult.valid();
        }

        const fieldElement = this.getFieldElement();

        this.getOption('onBeforeValidate')(fieldElement, this.containerElement);

        const actionId = startAction(this);

        this.setStatus(FieldStatus.Validating);

        const value = this.getValue();

        let validationResult;

        // eslint-disable-next-line no-restricted-syntax
        for (const validatorItem of this.validators) {
            const validateFn = this.getValidateFnByValidatorItem(validatorItem);
            try {
                // eslint-disable-next-line no-await-in-loop
                validationResult = await validateFn(value);
            } catch (error) {
                finishAction(this, actionId);
                this.setStatus(FieldStatus.No);
                this.getOption('onValidationError')(error, fieldElement, this.containerElement);
                throw error;
            }

            if (!validationResult.isValid()) {
                break;
            }
        }

        finishAction(this, actionId);

        if (!validationResult!.isValid() && !validationResult!.hasMessage()) {
            validationResult = ValidationResult.invalid(this.getOption('defaultInvalidMessage'));
        }

        this.validationResult = validationResult!;

        this.setStatus(this.validationResult.isValid() ? FieldStatus.Valid : FieldStatus.Invalid);

        this.getOption('onAfterValidate')(
            this.validationResult,
            fieldElement,
            this.containerElement,
        );

        return this.validationResult;
    }

    getValidateFnByValidatorItem(validatorItem: Validator): ValidateFn {
        if (validatorItem === 'required') {
            return (value) => {
                const isValid = !this.isEmpty(value);

                return ValidationResult.make(isValid, this.getInvalidErrorMessage('required'));
            };
        }

        if (typeof validatorItem === 'string') {
            return (value) => {
                const params = this.getOption('validatorParams')[validatorItem] || [];
                const vendorValidateFn: VendorValidateFn = validator[validatorItem];
                const isValid = value === '' || vendorValidateFn(value, ...params);

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

    getValue(): FieldValue {
        return this.withCachedFieldElement(() => {
            const fieldElement = this.getFieldElement();

            if (this.isTextable() || this.isSelect()) {
                return (fieldElement as ValueableElement).value;
            }

            if (this.isCheckbox()) {
                return (fieldElement as HTMLInputElement).checked;
            }

            if (this.isRadio()) {
                const checkedElement = this.getCheckedRadioElement();

                return checkedElement ? checkedElement.value : null;
            }

            if (this.isMultipleSelect()) {
                return this.getCheckedOptionElements().map((element) => element.value);
            }

            if (this.isFile()) {
                return (fieldElement as HTMLInputElement).files;
            }

            // @ts-expect-error The unexpected case, try to use the value.
            return fieldElement.value;
        });
    }

    getFieldElement<E extends HTMLElement = HTMLElement>(): E {
        if (this.cachedFieldElement !== null) {
            // @ts-expect-error It's ok.
            return this.cachedFieldElement;
        }

        const fieldElement = this.containerElement.querySelector<E>(this.fieldSelector);

        if (!fieldElement) {
            throw new Error(`A field element with the "${this.fieldSelector}" selector not found.`);
        }

        if (!(fieldElement instanceof HTMLElement)) {
            throw new Error(
                `A field element with the "${this.fieldSelector}" selector is not instance of the HTMLElement.`,
            );
        }

        return fieldElement;
    }

    withCachedFieldElement<T>(fn: () => T): T {
        this.cachedFieldElement = this.getFieldElement();
        const result = fn();
        this.cachedFieldElement = null;
        return result;
    }

    getFieldWrapperElement(): HTMLElement | null {
        const fieldElement = this.getFieldElement();
        const parentElement = fieldElement.parentElement;
        if (!parentElement) {
            return null;
        }
        if (!(parentElement instanceof HTMLElement)) {
            return null;
        }

        return 'fieldWrapper' in parentElement.dataset ? parentElement : null;
    }

    exists(): boolean {
        return this.containerElement.querySelector(this.fieldSelector) !== null;
    }

    getListElements(): Element[] {
        return Array.from(this.containerElement.querySelectorAll(this.fieldSelector));
    }

    findElementIndexInList(element: Element): number {
        return this.getListElements().findIndex((e) => e.isSameNode(element));
    }

    getCheckedRadioElement(): HTMLInputElement | null {
        if (!this.isRadio()) {
            throw new Error('The field is not a radio element.');
        }

        const fieldElement = this.getFieldElement<HTMLInputElement>();

        return this.containerElement.querySelector(`[name=${fieldElement.name}]:checked`);
    }

    getCheckedOptionElements(): HTMLOptionElement[] {
        if (!this.isMultipleSelect()) {
            throw new Error('The field is not a multiple select element.');
        }

        return Array.from(this.getFieldElement().querySelectorAll('option:checked'));
    }

    getVirtualFieldsOfList(): Field[] {
        return this.getListElements().map((listElement) =>
            this.getVirtualFieldForElement(listElement as HTMLElement),
        );
    }

    getVirtualFieldForElement(element: HTMLElement): Field {
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

    isText(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }
        return fieldElement.type === 'text';
    }

    isList(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }

        if ('fieldId' in fieldElement.dataset) {
            return true;
        }

        return (
            this.containerElement.querySelectorAll(this.fieldSelector).length > 1 && !this.isRadio()
        );
    }

    isTextarea(): boolean {
        const fieldElement = this.getFieldElement();
        return fieldElement instanceof HTMLTextAreaElement;
    }

    isCheckbox(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }
        return fieldElement.type === 'checkbox';
    }

    isRadio(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }
        return fieldElement.type === 'radio';
    }

    isSelect(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLSelectElement)) {
            return false;
        }
        return fieldElement.type === 'select-one';
    }

    isMultipleSelect(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLSelectElement)) {
            return false;
        }
        return fieldElement.type === 'select-multiple';
    }

    isFile(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }
        return fieldElement.type === 'file';
    }

    isEmpty(value: FieldValue): boolean {
        if (this.isTextable() || this.isSelect()) {
            return value === '';
        }

        if (this.isCheckbox()) {
            return value === false;
        }

        if (this.isRadio()) {
            return value === null;
        }

        if (this.isMultipleSelect() || this.isFile()) {
            return (value as string[] | FileList).length === 0;
        }

        return value === '';
    }

    isTextable(): boolean {
        return this.isText() || this.isTextarea();
    }

    getInvalidErrorMessage(validatorName: ValidatorName): string {
        return (
            this.getOption('invalidMessages')[validatorName] ||
            this.getOption('defaultInvalidMessage')
        );
    }

    reset(): void {
        this.validationResult = null;
        this.setStatus(FieldStatus.No);
    }

    trim(): void {
        if (this.getOption('trimEnabled') && this.isTextable()) {
            const fieldElement = this.getFieldElement<ValueableElement>();
            if (fieldElement.value.startsWith(' ') || fieldElement.value.endsWith(' ')) {
                fieldElement.value = fieldElement.value.trim();
                this.getOption('onChange')(fieldElement.value, fieldElement, this.containerElement);
            }
        }
    }

    setStatus(status: FieldStatus): void {
        const fieldElement = this.getFieldElement();
        const wrapperElement = this.getFieldWrapperElement();

        const element = wrapperElement || fieldElement;

        element.classList.remove(FieldStatus.Validating, FieldStatus.Valid, FieldStatus.Invalid);

        if (status === FieldStatus.No) {
            this.getOption('onStatusReset')(fieldElement, this.containerElement, wrapperElement);
        }

        if (status !== FieldStatus.No) {
            element.classList.add(status);
        }

        this.getOption('onStatusChange')(
            status,
            this.validationResult,
            fieldElement,
            this.containerElement,
            wrapperElement,
        );
    }
}
