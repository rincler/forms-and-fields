import ValidationResult from './ValidationResult';
import { finishAction, ignoreRejects, startAction } from './Reject';
import Field from './Field';
import { FormOptionName, FormOptions, FormStatus, SubmitFn } from './types';

const NOOP = (): void => {};

const DEFAULT_OPTIONS: FormOptions = {
    onBeforeValidate: NOOP,
    onAfterValidate: NOOP,
    onValidationError: NOOP,
    onBeforeSubmit: NOOP,
    onAfterSubmit: NOOP,
    onAfterPositiveSubmit: NOOP,
    onAfterNegativeSubmit: NOOP,
    onSubmissionError: NOOP,
    onResetStatus: NOOP,
};

const ALLOWED_OPTIONS = [...Object.keys(DEFAULT_OPTIONS), 'validate', 'setStatus'];

export default class Form {
    formElement: HTMLFormElement;
    fields: Field[];
    submit: SubmitFn;
    options: FormOptions;
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
            throw new Error(`An element with the "${formSelector}" selector is not a form.`);
        }

        this.formElement = formElement;

        this.submit = submit;
        this.fields = fields;

        this.options = {};
        this.setOptions(options);

        this.actionId = 0;
    }

    listen(): void {
        this.formElement.addEventListener('change', () => {
            this.setStatus(FormStatus.No);
        });
        this.formElement.addEventListener('keyup', () => {
            this.setStatus(FormStatus.No);
        });
        this.formElement.addEventListener('submit', this.onSubmitForm.bind(this));

        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
            field.listen();
        }
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
        // eslint-disable-next-line no-restricted-syntax
        for (const field of this.fields) {
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
                validatorParams: field.hasOption('validatorParams')
                    ? field.getOption('validatorParams')
                    : options.validatorParams,
                onChange: field.hasOption('onChange')
                    ? field.getOption('onChange')
                    : options.onChange,
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
                onResetStatus: field.hasOption('onResetStatus')
                    ? field.getOption('onResetStatus')
                    : options.onResetFieldStatus,
                setStatus: field.hasOption('setStatus')
                    ? field.getOption('setStatus')
                    : options.setFieldStatus,
            });
        }
    }

    async onSubmitForm(e: Event): Promise<void> {
        e.preventDefault();

        await ignoreRejects(async () => {
            const validationResults = await this.validate();

            const isValid = ValidationResult.areValid(validationResults);

            if (!isValid) {
                return;
            }

            await this.runSubmitProcess();
        });
    }

    async validate(): Promise<ValidationResult[]> {
        if (
            this.fields.every((field) => field.validators.length === 0) &&
            !this.hasOption('validate')
        ) {
            return Promise.resolve([]);
        }

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

        const isValid = ValidationResult.areValid(validationResults);

        this.setStatus(isValid ? FormStatus.Valid : FormStatus.Invalid);

        this.getOption('onAfterValidate')(validationResults, this.formElement);

        return validationResults;
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

        this.getOption('onAfterSubmit')(submissionResult, this.formElement);

        if (submissionResult.isPositive()) {
            this.setStatus(FormStatus.PositiveSubmit);
            this.getOption('onAfterPositiveSubmit')(submissionResult.getData(), this.formElement);
        } else {
            this.setStatus(FormStatus.NegativeSubmit);
            this.getOption('onAfterNegativeSubmit')(submissionResult.getData(), this.formElement);
        }
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

            if (field.isList()) {
                fields.push(...field.getVirtualFieldsOfList());
            } else {
                fields.push(field);
            }
        }

        return fields;
    }

    setStatus(status: FormStatus): void {
        if (status === FormStatus.No) {
            this.getOption('onResetStatus')(this.formElement);
        }

        if (this.hasOption('setStatus')) {
            this.getOption('setStatus')(status, this.formElement);
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
        if (status !== FormStatus.No) {
            this.formElement.classList.add(status);
        }
    }
}
