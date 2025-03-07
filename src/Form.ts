import ValidationResult from './ValidationResult';
import SubmissionResult from './SubmissionResult';
import { finishAction, ignoreRejects, startAction } from './Reject';
import Field from './Field';
import {
    FieldStatus,
    FieldsValidationResult,
    FormOptionName,
    FormOptions,
    FormStatus,
    FormValidationResult,
    SubmitFn,
} from './types';

const NOOP = (): void => {};

const DEFAULT_OPTIONS: FormOptions = {
    cssStatusEnabled: true,
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
    onValidationError: NOOP,
    onBeforeSubmit: NOOP,
    onAfterSubmit: NOOP,
    onSubmissionError: NOOP,
    onStatusChange: NOOP,
    onStatusReset: NOOP,
};

const ALLOWED_OPTIONS = [...Object.keys(DEFAULT_OPTIONS), 'validate'];

export default class Form {
    formElement: HTMLFormElement;
    fields: Field[];
    submit: SubmitFn;
    options: FormOptions;
    status: FormStatus;
    validationResult: FormValidationResult | null;
    submissionResult: SubmissionResult | null;
    processingFields: Record<string, Field>;
    actionId: number;

    constructor(
        formSelector: string,
        fields: Field[],
        submit: SubmitFn,
        options: FormOptions = {},
    ) {
        const formElement = document.querySelector(formSelector);

        if (!formElement) {
            throw new Error(`A form element with the "${formSelector}" selector not found.`);
        }

        if (!(formElement instanceof HTMLFormElement)) {
            throw new Error(
                `A form element with the "${formSelector}" selector is not instance of the HTMLFormElement.`,
            );
        }

        this.formElement = formElement;

        this.submit = submit;
        this.fields = fields;

        this.options = {};
        this.setOptions(options);

        this.status = FormStatus.No;
        this.validationResult = null;
        this.submissionResult = null;
        this.processingFields = {};
        this.actionId = 0;
    }

    listen(): () => void {
        const resetListener = this.reset.bind(this);
        const onSubmitListener = this.onSubmit.bind(this);

        this.formElement.addEventListener('change', resetListener);
        this.formElement.addEventListener('keyup', resetListener);
        this.formElement.addEventListener('submit', onSubmitListener);

        const stopListeningFields = this.fields.map((field) => field.listen());

        return () => {
            this.formElement.removeEventListener('change', resetListener);
            this.formElement.removeEventListener('keyup', resetListener);
            this.formElement.removeEventListener('submit', onSubmitListener);
            stopListeningFields.forEach((stopListeningField) => stopListeningField());
        };
    }

    async onSubmit(e: Event): Promise<void> {
        e.preventDefault();

        this.reset();

        await ignoreRejects(async () => {
            const validationResult = await this.validate();

            if (ValidationResult.areValid(Object.values(validationResult))) {
                await this.runSubmitProcess();
            }
        });
    }

    setOptions(options: FormOptions): void {
        // eslint-disable-next-line no-restricted-syntax
        for (const name of Object.keys(options) as Array<FormOptionName>) {
            if (ALLOWED_OPTIONS.includes(name) && options[name] !== undefined) {
                // @ts-expect-error The same type.
                this.options[name] = options[name];
            }
        }
        this.setFieldOptions(options);
    }

    getOption<Name extends FormOptionName>(name: Name): Required<FormOptions>[Name] {
        if (this.hasOption(name)) {
            return this.options[name] as Required<FormOptions>[Name];
        }

        if (DEFAULT_OPTIONS[name] === undefined) {
            throw new Error(`The "${name}" form option is not set.`);
        }

        return DEFAULT_OPTIONS[name] as Required<FormOptions>[Name];
    }

    hasOption(name: FormOptionName): boolean {
        return this.options[name] !== undefined;
    }

    setFieldOptions(options: FormOptions): void {
        this.fields.forEach((field) => {
            this.setOptionsToField(options, field);
        });
    }

    setOptionsToField(options: FormOptions, field: Field): void {
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
                ? field.getOption('validationCacheEnabled')
                : options.validationCacheEnabled,
            cssStatusEnabled: field.hasOption('cssStatusEnabled')
                ? field.getOption('cssStatusEnabled')
                : options.cssStatusEnabled,
            validatorParams: field.hasOption('validatorParams')
                ? field.getOption('validatorParams')
                : options.validatorParams,
            onChange: field.hasOption('onChange') ? field.getOption('onChange') : options.onChange,
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
            onStatusChange: field.hasOption('onStatusChange')
                ? field.getOption('onStatusChange')
                : options.onFieldStatusChange,
            onStatusReset: field.hasOption('onStatusReset')
                ? field.getOption('onStatusReset')
                : options.onFieldStatusReset,
        });
    }

    async validate(): Promise<FormValidationResult> {
        this.getOption('onBeforeValidate')(this.formElement);

        const actionId = startAction(this);

        this.setStatus(FormStatus.Validating);

        let formValidationResult: FormValidationResult;

        try {
            const fieldsValidationResult = await this.validateFields();
            const areFieldsValid = ValidationResult.areValid(Object.values(fieldsValidationResult));
            formValidationResult = {
                ...fieldsValidationResult,
                '*':
                    this.hasOption('validate') && areFieldsValid
                        ? await this.getOption('validate')(this.getData())
                        : ValidationResult.make(areFieldsValid),
            };
        } catch (error) {
            finishAction(this, actionId);
            this.setStatus(FormStatus.No);
            this.getOption('onValidationError')(error, this.formElement);
            throw error;
        }

        finishAction(this, actionId);

        this.validationResult = formValidationResult;

        const isValid = ValidationResult.areValid(Object.values(formValidationResult));

        this.setStatus(isValid ? FormStatus.Valid : FormStatus.Invalid);

        this.getOption('onAfterValidate')(this.validationResult, this.formElement);

        return this.validationResult;
    }

    async validateFields(): Promise<FieldsValidationResult> {
        const fieldEntries = Object.entries(this.getProcessingFields());
        const results = await Promise.all(fieldEntries.map(([, field]) => field.validate()));
        return Object.fromEntries(fieldEntries.map(([key], i) => [key, results[i]]));
    }

    async runSubmitProcess(): Promise<void> {
        const data = this.getData();

        this.getOption('onBeforeSubmit')(data, this.formElement);

        const actionId = startAction(this);

        this.setStatus(FormStatus.Submitting);

        let submissionResult;

        try {
            submissionResult = await this.submit(data);
        } catch (error) {
            finishAction(this, actionId);
            this.setStatus(FormStatus.Valid);
            this.getOption('onSubmissionError')(error, this.formElement);
            throw error;
        }

        finishAction(this, actionId);

        this.submissionResult = submissionResult;

        if (this.submissionResult.isInvalid()) {
            this.handleInvalidSubmissionResult();
            this.setStatus(FormStatus.Invalid);
        } else {
            this.setStatus(
                this.submissionResult.isPositive()
                    ? FormStatus.PositiveSubmit
                    : FormStatus.NegativeSubmit,
            );
        }

        this.getOption('onAfterSubmit')(this.submissionResult, this.formElement);
    }

    handleInvalidSubmissionResult(): void {
        Object.entries(this.submissionResult!.getData().invalid!).forEach(([key, message]) => {
            const validationResult = ValidationResult.invalid(message);
            if (key in this.processingFields) {
                this.processingFields[key].validationResult = validationResult;
                this.processingFields[key].setStatus(FieldStatus.Invalid);
            }
            if (key in this.validationResult!) {
                this.validationResult![key] = validationResult;
            }
        });
        if (!('*' in this.submissionResult!.getData().invalid!)) {
            this.validationResult!['*'] = ValidationResult.invalid();
        }
    }

    getData(): FormData {
        return new FormData(this.formElement);
    }

    getProcessingFields(): Record<string, Field> {
        let processingFields: Record<string, Field> = {};

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            if (!field.exists()) {
                continue;
            }

            if (field.isGroup()) {
                processingFields = field.getVirtualFieldsOfGroup().reduce((fields, field, i) => {
                    return {
                        ...fields,
                        [`${field.name!}.${i}`]: field,
                    };
                }, processingFields);
            } else {
                processingFields[field.name!] = field;
            }
        }

        this.processingFields = processingFields;

        return this.processingFields;
    }

    reset(): void {
        this.validationResult = null;
        this.submissionResult = null;
        this.setStatus(FormStatus.No);
    }

    setStatus(status: FormStatus): void {
        if (this.status === status) {
            return;
        }

        this.status = status;
        this.updateCssStatus();

        if (status === FormStatus.No) {
            this.getOption('onStatusReset')(this.formElement);
        }

        this.getOption('onStatusChange')(
            status,
            this.validationResult,
            this.submissionResult,
            this.formElement,
        );
    }

    updateCssStatus(): void {
        if (!this.getOption('cssStatusEnabled')) {
            return;
        }

        this.formElement.classList.remove(
            FormStatus.Validating,
            FormStatus.Valid,
            FormStatus.Invalid,
            FormStatus.Submitting,
            FormStatus.PositiveSubmit,
            FormStatus.NegativeSubmit,
        );

        if (this.status !== FormStatus.No) {
            this.formElement.classList.add(this.status);
        }
    }
}
