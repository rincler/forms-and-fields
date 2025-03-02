import ValidationResult from './ValidationResult';
import { finishAction, ignoreRejects, startAction } from './Reject';
import Field from './Field';
import { FormOptionName, FormOptions, FormStatus, SubmitFn } from './types';
import SubmissionResult from './SubmissionResult.js';

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
    validationResults: ValidationResult[];
    submissionResult: SubmissionResult | null;
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

        this.validationResults = [];
        this.submissionResult = null;
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
            const validationResults = await this.validate();

            if (ValidationResult.areValid(validationResults)) {
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

    async validate(): Promise<ValidationResult[]> {
        this.getOption('onBeforeValidate')(this.formElement);

        const actionId = startAction(this);

        this.setStatus(FormStatus.Validating);

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
            this.setStatus(FormStatus.No);
            this.getOption('onValidationError')(error, this.formElement);
            throw error;
        }

        finishAction(this, actionId);

        this.validationResults = validationResults;

        const isValid = ValidationResult.areValid(this.validationResults);

        this.setStatus(isValid ? FormStatus.Valid : FormStatus.Invalid);

        this.getOption('onAfterValidate')(this.validationResults, this.formElement);

        return this.validationResults;
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

        this.setStatus(
            this.submissionResult.isPositive()
                ? FormStatus.PositiveSubmit
                : FormStatus.NegativeSubmit,
        );

        this.getOption('onAfterSubmit')(this.submissionResult, this.formElement);
    }

    getData(): FormData {
        return new FormData(this.formElement);
    }

    getAllFields(): Field[] {
        const fields = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            if (!field.exists()) {
                continue;
            }

            if (field.isGroup()) {
                fields.push(...field.getVirtualFieldsOfGroup());
            } else {
                fields.push(field);
            }
        }

        return fields;
    }

    reset(): void {
        this.validationResults = [];
        this.submissionResult = null;
        this.setStatus(FormStatus.No);
    }

    setStatus(status: FormStatus): void {
        this.setCssClass(status);

        if (status === FormStatus.No) {
            this.getOption('onStatusReset')(this.formElement);
        }

        this.getOption('onStatusChange')(
            status,
            this.validationResults,
            this.submissionResult,
            this.formElement,
        );
    }

    setCssClass(cssClass: string): void {
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

        if (cssClass !== '') {
            this.formElement.classList.add(cssClass);
        }
    }
}
