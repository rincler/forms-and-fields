import validator from 'validator';
import ValidationResult from './ValidationResult';
import { finishAction, ignoreRejects, startAction } from './Reject';
import {
    FieldElement,
    FieldOptionName,
    FieldOptions,
    FieldStatus,
    FieldValue,
    ValidateFn,
    Validator,
    ValidatorName,
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
    cssStatusEnabled: true,
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
    status: FieldStatus;
    validationResult: ValidationResult | null;
    cachedFieldElement: FieldElement | null;
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

        this.status = FieldStatus.No;
        this.validationResult = null;
        this.cachedFieldElement = null;
        this.virtualFieldsCache = {};
        this.actionId = 0;
        this.typingDelayId = null;
    }

    listen(): () => void {
        const onChangeListener = this.createListener(this.onChange);
        const onKeyUpListener = this.createListener(this.onKeyUp);

        this.containerElement.addEventListener('change', onChangeListener);
        this.containerElement.addEventListener('keyup', onKeyUpListener);

        return () => {
            this.containerElement.removeEventListener('change', onChangeListener);
            this.containerElement.removeEventListener('keyup', onKeyUpListener);
        };
    }

    createListener(listener: EventListener) {
        return (event: Event): void => {
            if (!this.isFieldElement(event.target as Element)) {
                return;
            }
            const target = event.target as FieldElement;
            if (target.matches(this.fieldSelector)) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                let field = this;
                if (this.isGroup()) {
                    const virtualFields = this.getVirtualFieldsOfGroup();
                    // @ts-expect-error It's ok.
                    field = virtualFields[this.findElementIndexInGroup(target)];
                }
                listener.call(field, event);
            }
        };
    }

    async onChange(event: Event): Promise<void> {
        if (!this.isTextable()) {
            this.reset();
        }

        const fieldElement = event.target as FieldElement;
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

        const fieldElement = event.target as FieldElement;

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
        for (const name of Object.keys(options) as Array<FieldOptionName>) {
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

        const fieldElement = this.getFieldElement();

        this.getOption('onBeforeValidate')(fieldElement, this.containerElement);

        const actionId = startAction(this);

        this.setStatus(FieldStatus.Validating);

        this.trimIfRequired();

        const value = this.getValue();

        let validationResult = ValidationResult.valid();

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

        if (!validationResult.isValid() && !validationResult.hasMessage()) {
            validationResult = ValidationResult.invalid({
                message: this.getOption('defaultInvalidMessage'),
                data: validationResult.getData(),
            });
        }

        this.validationResult = validationResult;

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
                return ValidationResult.make(
                    !this.isEmpty(value),
                    this.getInvalidErrorMessage('required'),
                );
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

        throw new Error('Invalid validator.');
    }

    getValue(): FieldValue {
        return this.withCachedFieldElement(() => {
            const fieldElement = this.getFieldElement();

            if (this.isTextable() || this.isSelect()) {
                return fieldElement.value;
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

            return fieldElement.value;
        });
    }

    isFieldElement(element: Element): boolean {
        return (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
        );
    }

    getFieldElement<E extends FieldElement = FieldElement>(): E {
        if (this.cachedFieldElement !== null) {
            // @ts-expect-error It's ok.
            return this.cachedFieldElement;
        }

        const fieldElement = this.containerElement.querySelector(this.fieldSelector);

        if (!fieldElement) {
            throw new Error(`A field element with the "${this.fieldSelector}" selector not found.`);
        }

        if (!this.isFieldElement(fieldElement)) {
            throw new Error(
                `A field element with the "${this.fieldSelector}" selector is not field element.`,
            );
        }

        return fieldElement as E;
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

    getGroupElements(): FieldElement[] {
        return Array.from(
            this.containerElement.querySelectorAll(`${this.fieldSelector}[data-group-field]`),
        );
    }

    findElementIndexInGroup(element: FieldElement): number {
        return this.getGroupElements().findIndex((e) => e.isSameNode(element));
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

    getVirtualFieldsOfGroup(): Field[] {
        return this.getGroupElements().map((groupElement) =>
            this.getVirtualFieldForElement(groupElement),
        );
    }

    getVirtualFieldForElement(element: FieldElement): Field {
        if (!element.dataset.groupField) {
            // eslint-disable-next-line no-param-reassign
            element.dataset.groupField = Math.random().toString(36).substring(2);
        }

        if (this.virtualFieldsCache[element.dataset.groupField]) {
            return this.virtualFieldsCache[element.dataset.groupField];
        }

        const field = new Field(
            `${this.fieldSelector}[data-group-field="${element.dataset.groupField}"]`,
            this.containerSelector,
            this.validators,
            this.options,
        );
        this.virtualFieldsCache[element.dataset.groupField] = field;

        return field;
    }

    isText(): boolean {
        const fieldElement = this.getFieldElement();
        if (!(fieldElement instanceof HTMLInputElement)) {
            return false;
        }
        return fieldElement.type === 'text';
    }

    isGroup(): boolean {
        return this.getGroupElements().length > 0;
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

    trimIfRequired(): void {
        if (this.getOption('trimEnabled') && this.isTextable()) {
            const fieldElement = this.getFieldElement();
            const trimmedValue = fieldElement.value.trim();
            if (fieldElement.value !== trimmedValue) {
                fieldElement.value = trimmedValue;
                this.getOption('onChange')(fieldElement.value, fieldElement, this.containerElement);
            }
        }
    }

    setStatus(status: FieldStatus): void {
        if (this.status === status) {
            return;
        }

        this.status = status;
        this.updateCssStatus();

        const fieldElement = this.getFieldElement();
        const wrapperElement = this.getFieldWrapperElement();

        if (status === FieldStatus.No) {
            this.getOption('onStatusReset')(fieldElement, this.containerElement, wrapperElement);
        }

        this.getOption('onStatusChange')(
            status,
            this.validationResult,
            fieldElement,
            this.containerElement,
            wrapperElement,
        );
    }

    updateCssStatus(): void {
        if (!this.getOption('cssStatusEnabled')) {
            return;
        }

        const element = this.getFieldWrapperElement() || this.getFieldElement();

        element.classList.remove(FieldStatus.Validating, FieldStatus.Valid, FieldStatus.Invalid);

        if (this.status !== FieldStatus.No) {
            element.classList.add(this.status);
        }
    }
}
