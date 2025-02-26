import { fireEvent, waitFor } from '@testing-library/dom';
import Field from '../src/Field';
import Form from '../src/Form';
import ValidationResult from '../src/ValidationResult';
import SubmissionResult from '../src/SubmissionResult';

// @ts-expect-error It will not be `null` after the `beforeEach`.
let formElement: HTMLFormElement = null;
// @ts-expect-error It will not be `null` after the `beforeEach`.
let inputElement: HTMLInputElement = null;
const submit = () => SubmissionResult.positive();
const defaultInvalidValueMessage = 'Invalid value.';
jest.useFakeTimers();

const getInputElement = (selector: string): HTMLInputElement => {
    return document.querySelector<HTMLInputElement>(selector)!;
};

beforeEach(() => {
    document.body.innerHTML = `
        <form class="js-form">
            <input class="js-input" name="input-name" />
            <input class="js-group-input" name="group-input-name" />
            <input class="js-group-input" name="group-input-name" />
            <input class="js-group-input" name="group-input-name" />
            <input class="js-checkbox" type="checkbox" name="checkbox-name" />
            <input class="js-radio" type="radio" name="radio-name" value="1" />
            <input class="js-radio" type="radio" name="radio-name" value="2" />
            <select class="js-select" name="select-name">
                <option value="1"></option>
                <option value="2"></option>
            </select>
            <select multiple class="js-multiple-select" name="multiple-select-name">
                <option value="1"></option>
                <option value="2"></option>
            </select>
            <textarea class="js-textarea" name="textarea-name"></textarea>
        </form>`;

    formElement = document.querySelector<HTMLFormElement>('.js-form')!;
    inputElement = getInputElement('.js-input');
});

describe('field options', () => {
    test('pass options to fields', () => {
        const invalidMessages = { required: 'this is required' };
        const defaultInvalidMessage = 'some default invalid message';
        const trimEnabled = false;
        const typingDelay = 3;
        const validateOnChange = true;
        const validateOnType = true;
        const validatorParams = { isEmail: [{ allow_utf8_local_part: false }] };
        const validationCacheEnabled = false;
        const cssStatusEnabled = false;
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const onBeforeValidateField = jest.fn();
        const onAfterValidateField = jest.fn();
        const onFieldValidationError = jest.fn();
        const onFieldStatusChange = jest.fn();
        const onFieldStatusReset = jest.fn();

        const inputField = new Field('.js-input', '.js-form');
        const checkboxField = new Field('.js-checkbox', '.js-form');

        // eslint-disable-next-line no-new
        new Form('.js-form', [inputField, checkboxField], submit, {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
            validationCacheEnabled,
            cssStatusEnabled,
            onChange,
            onTypingStart,
            onTypingEnd,
            onBeforeValidateField,
            onAfterValidateField,
            onFieldValidationError,
            onFieldStatusChange,
            onFieldStatusReset,
        });

        expect(inputField.getOption('invalidMessages')).toBe(invalidMessages);
        expect(checkboxField.getOption('invalidMessages')).toBe(invalidMessages);

        expect(inputField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);
        expect(checkboxField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);

        expect(inputField.getOption('trimEnabled')).toBe(trimEnabled);
        expect(checkboxField.getOption('trimEnabled')).toBe(trimEnabled);

        expect(inputField.getOption('typingDelay')).toBe(typingDelay);
        expect(checkboxField.getOption('typingDelay')).toBe(typingDelay);

        expect(inputField.getOption('validateOnChange')).toBe(validateOnChange);
        expect(checkboxField.getOption('validateOnChange')).toBe(validateOnChange);

        expect(inputField.getOption('validateOnType')).toBe(validateOnType);
        expect(checkboxField.getOption('validateOnType')).toBe(validateOnType);

        expect(inputField.getOption('validatorParams')).toBe(validatorParams);
        expect(checkboxField.getOption('validatorParams')).toBe(validatorParams);

        expect(inputField.getOption('validationCacheEnabled')).toBe(validationCacheEnabled);
        expect(checkboxField.getOption('validationCacheEnabled')).toBe(validationCacheEnabled);

        expect(inputField.getOption('cssStatusEnabled')).toBe(cssStatusEnabled);
        expect(checkboxField.getOption('cssStatusEnabled')).toBe(cssStatusEnabled);

        expect(inputField.getOption('onChange')).toBe(onChange);
        expect(checkboxField.getOption('onChange')).toBe(onChange);

        expect(inputField.getOption('onTypingStart')).toBe(onTypingStart);
        expect(checkboxField.getOption('onTypingStart')).toBe(onTypingStart);

        expect(inputField.getOption('onTypingEnd')).toBe(onTypingEnd);
        expect(checkboxField.getOption('onTypingEnd')).toBe(onTypingEnd);

        expect(inputField.getOption('onBeforeValidate')).toBe(onBeforeValidateField);
        expect(checkboxField.getOption('onBeforeValidate')).toBe(onBeforeValidateField);

        expect(inputField.getOption('onAfterValidate')).toBe(onAfterValidateField);
        expect(checkboxField.getOption('onAfterValidate')).toBe(onAfterValidateField);

        expect(inputField.getOption('onValidationError')).toBe(onFieldValidationError);
        expect(checkboxField.getOption('onValidationError')).toBe(onFieldValidationError);

        expect(inputField.getOption('onStatusChange')).toBe(onFieldStatusChange);
        expect(checkboxField.getOption('onStatusChange')).toBe(onFieldStatusChange);

        expect(inputField.getOption('onStatusReset')).toBe(onFieldStatusReset);
        expect(checkboxField.getOption('onStatusReset')).toBe(onFieldStatusReset);
    });

    test('form options do not override field options', () => {
        const invalidMessages = { required: 'this field is required' };
        const defaultInvalidMessage = 'some field default invalid message';
        const trimEnabled = true;
        const typingDelay = 2;
        const validateOnChange = true;
        const validateOnType = true;
        const validatorParams = { isEmail: [{ allow_utf8_local_part: false }] };
        const validationCacheEnabled = false;
        const cssStatusEnabled = false;
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const onBeforeValidate = jest.fn();
        const onAfterValidate = jest.fn();
        const onValidationError = jest.fn();
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();

        const inputField = new Field('.js-input', '.js-form', [], {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
            validationCacheEnabled,
            cssStatusEnabled,
            onChange,
            onTypingStart,
            onTypingEnd,
            onBeforeValidate,
            onAfterValidate,
            onValidationError,
            onStatusChange,
            onStatusReset,
        });

        // eslint-disable-next-line no-new
        new Form('.js-form', [inputField], submit, {
            invalidMessages: { required: 'this is required' },
            defaultInvalidMessage: 'some default invalid message',
            trimEnabled: false,
            typingDelay: 3,
            validateOnChange: false,
            validateOnType: false,
            validatorParams: { isEmail: [{ allow_utf8_local_part: false }] },
            validationCacheEnabled: true,
            cssStatusEnabled: true,
            onChange: jest.fn(),
            onTypingStart: jest.fn(),
            onTypingEnd: jest.fn(),
            onBeforeValidateField: jest.fn(),
            onAfterValidateField: jest.fn(),
            onFieldValidationError: jest.fn(),
            onFieldStatusChange: jest.fn(),
            onFieldStatusReset: jest.fn(),
        });

        expect(inputField.getOption('invalidMessages')).toBe(invalidMessages);
        expect(inputField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);
        expect(inputField.getOption('trimEnabled')).toBe(trimEnabled);
        expect(inputField.getOption('typingDelay')).toBe(typingDelay);
        expect(inputField.getOption('validateOnChange')).toBe(validateOnChange);
        expect(inputField.getOption('validateOnType')).toBe(validateOnType);
        expect(inputField.getOption('validatorParams')).toBe(validatorParams);
        expect(inputField.getOption('validationCacheEnabled')).toBe(validationCacheEnabled);
        expect(inputField.getOption('cssStatusEnabled')).toBe(cssStatusEnabled);
        expect(inputField.getOption('onChange')).toBe(onChange);
        expect(inputField.getOption('onTypingStart')).toBe(onTypingStart);
        expect(inputField.getOption('onTypingEnd')).toBe(onTypingEnd);
        expect(inputField.getOption('onBeforeValidate')).toBe(onBeforeValidate);
        expect(inputField.getOption('onAfterValidate')).toBe(onAfterValidate);
        expect(inputField.getOption('onValidationError')).toBe(onValidationError);
        expect(inputField.getOption('onStatusChange')).toBe(onStatusChange);
        expect(inputField.getOption('onStatusReset')).toBe(onStatusReset);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onChange,
        });
        form.listen();

        inputElement.value = 'foo';

        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(inputElement);
        expect(onChange.mock.calls[0][2]).toBe(formElement);
    });

    test('"onChange" is not called after stopping listening', () => {
        const onChange = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onChange,
        });
        const stopListening = form.listen();
        stopListening();

        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('validation callback options', () => {
    test('"onBeforeValidateField" is called', async () => {
        const onBeforeValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onBeforeValidateField,
            },
        );

        await form.validate();

        const checkboxElement = document.querySelector('.js-checkbox');

        expect(onBeforeValidateField).toHaveBeenCalledTimes(2);
        expect(onBeforeValidateField.mock.calls[0][0]).toBe(inputElement);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
        expect(onBeforeValidateField.mock.calls[1][0]).toBe(checkboxElement);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
    });

    test('"onAfterValidateField" is called', async () => {
        const onAfterValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onAfterValidateField,
            },
        );

        await form.validate();

        const checkboxElement = document.querySelector('.js-checkbox');

        expect(onAfterValidateField).toHaveBeenCalledTimes(2);
        expect(onAfterValidateField.mock.calls[0][0]).toStrictEqual(
            ValidationResult.invalid(defaultInvalidValueMessage),
        );
        expect(onAfterValidateField.mock.calls[0][1]).toBe(inputElement);
        expect(onAfterValidateField.mock.calls[0][2]).toBe(formElement);
        expect(onAfterValidateField.mock.calls[1][0]).toStrictEqual(
            ValidationResult.invalid(defaultInvalidValueMessage),
        );
        expect(onAfterValidateField.mock.calls[1][1]).toBe(checkboxElement);
        expect(onAfterValidateField.mock.calls[1][2]).toBe(formElement);
    });

    test('"onFieldValidationError" is called', async () => {
        const onFieldValidationError = jest.fn();
        const error = new Error('foo');
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', [
                    () => {
                        throw error;
                    },
                ]),
                new Field('.js-select', '.js-form', [
                    () => {
                        throw error;
                    },
                ]),
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onFieldValidationError,
            },
        );

        await expect(form.validate()).rejects.toThrow(error);

        expect(onFieldValidationError).toHaveBeenCalledTimes(2);
        expect(onFieldValidationError.mock.calls[0][0]).toBe(error);
        expect(onFieldValidationError.mock.calls[0][1]).toBe(
            document.querySelector('.js-checkbox'),
        );
        expect(onFieldValidationError.mock.calls[0][2]).toBe(formElement);
        expect(onFieldValidationError.mock.calls[1][0]).toBe(error);
        expect(onFieldValidationError.mock.calls[1][1]).toBe(document.querySelector('.js-select'));
        expect(onFieldValidationError.mock.calls[1][2]).toBe(formElement);
    });

    test('"onBeforeValidate" is called', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onBeforeValidate,
            },
        );

        await form.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(formElement);
    });

    test('"onAfterValidate" is called', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onAfterValidate,
            },
        );

        await form.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toStrictEqual([
            ValidationResult.invalid(defaultInvalidValueMessage),
            ValidationResult.invalid(defaultInvalidValueMessage),
            ValidationResult.valid(),
            ValidationResult.invalid(),
        ]);
        expect(onAfterValidate.mock.calls[0][1]).toBe(formElement);
    });

    test('"onValidationError" is called when validating fields', async () => {
        const onValidationError = jest.fn();
        const error = new Error('foo');
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', [
                    () => {
                        throw error;
                    },
                ]),
                new Field('.js-select', '.js-form', [
                    () => {
                        throw error;
                    },
                ]),
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onValidationError,
            },
        );

        await expect(form.validate()).rejects.toThrow(error);

        expect(onValidationError).toHaveBeenCalledTimes(1);
        expect(onValidationError.mock.calls[0][0]).toBe(error);
        expect(onValidationError.mock.calls[0][1]).toBe(formElement);
    });

    test('"onValidationError" is called when validating form', async () => {
        const onValidationError = jest.fn();
        const error = new Error('foo');
        const form = new Form('.js-form', [], submit, {
            validate: () => {
                throw error;
            },
            onValidationError,
        });

        await expect(form.validate()).rejects.toThrow(error);

        expect(onValidationError).toHaveBeenCalledTimes(1);
        expect(onValidationError.mock.calls[0][0]).toBe(error);
        expect(onValidationError.mock.calls[0][1]).toBe(formElement);
    });
});

describe('submit callback options', () => {
    test('"onBeforeSubmit" is called', async () => {
        const onBeforeSubmit = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onBeforeSubmit,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onBeforeSubmit).toHaveBeenCalledTimes(1);
            expect(onBeforeSubmit.mock.calls[0][0]).toStrictEqual(new FormData(formElement));
            expect(onBeforeSubmit.mock.calls[0][1]).toBe(formElement);
        });
    });

    test('"onBeforeSubmit" is not called because of invalid form', async () => {
        const onBeforeSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            submit,
            {
                onBeforeSubmit,
            },
        );

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onBeforeSubmit).not.toHaveBeenCalled();
        });
    });

    test('"onAfterSubmit" is called with submission result', async () => {
        const onAfterSubmit = jest.fn();
        const form = new Form('.js-form', [], submit, {
            onAfterSubmit,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmit).toHaveBeenCalledTimes(1);
            expect(onAfterSubmit.mock.calls[0][0]).toStrictEqual(SubmissionResult.positive());
            expect(onAfterSubmit.mock.calls[0][1]).toBe(formElement);
        });
    });

    test('"onAfterSubmit" is not called because of invalid form', async () => {
        const onAfterSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onAfterSubmit,
            },
        );

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmit).not.toHaveBeenCalled();
        });
    });

    test('"onSubmissionError" is called', async () => {
        const onSubmissionError = jest.fn();
        const error = new Error('foo');

        const form = new Form(
            '.js-form',
            [],
            async () => {
                throw error;
            },
            {
                onSubmissionError,
            },
        );

        form.listen();

        await expect(form.runSubmitProcess()).rejects.toThrow(error);

        await waitFor(() => {
            expect(onSubmissionError).toHaveBeenCalledTimes(1);
            expect(onSubmissionError.mock.calls[0][0]).toBe(error);
            expect(onSubmissionError.mock.calls[0][1]).toBe(formElement);
        });
    });
});

describe('validation', () => {
    test.each([
        [
            'valid fields',
            ValidationResult.valid(),
            ValidationResult.valid(),
            ValidationResult.valid(),
        ],
        [
            'invalid fields',
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.invalid(),
        ],
    ])(
        '"validate" is not specified - %s',
        async (
            _,
            fieldValidationResult,
            expectedFieldValidationResult,
            expectedFormValidationResult,
        ) => {
            const validateFn = jest.fn(() => fieldValidationResult);
            const form = new Form(
                '.js-form',
                [
                    new Field('.js-input', '.js-form', [validateFn]),
                    new Field('.js-radio', '.js-form', [validateFn]),
                    new Field('.js-group-input', '.js-form', [validateFn]),
                    new Field('.js-no', '.js-form', [validateFn]),
                ],
                submit,
            );

            const validationResults = await form.validate();

            expect(validateFn).toHaveBeenCalledTimes(5);
            expect(validationResults).toStrictEqual([
                expectedFieldValidationResult,
                expectedFieldValidationResult,
                expectedFieldValidationResult,
                expectedFieldValidationResult,
                expectedFieldValidationResult,
                expectedFormValidationResult,
            ]);
        },
    );

    test.each([
        [
            'valid field, valid form',
            ValidationResult.valid(),
            ValidationResult.valid(),
            ValidationResult.valid(),
            ValidationResult.valid(),
        ],
        [
            'valid field, invalid form',
            ValidationResult.valid(),
            ValidationResult.invalid('Invalid form.'),
            ValidationResult.valid(),
            ValidationResult.invalid('Invalid form.'),
        ],
        [
            'invalid field, valid form',
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.valid(),
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.invalid(),
        ],
        [
            'invalid field, invalid form',
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.invalid('Invalid form'),
            ValidationResult.invalid('Invalid field.'),
            ValidationResult.invalid(),
        ],
    ])(
        '"validate" is specified - %s',
        async (
            _,
            fieldValidationResult,
            formValidationResult,
            expectedFieldValidationResult,
            expectedFormValidationResult,
        ) => {
            const validate = () => formValidationResult;
            const form = new Form(
                '.js-form',
                [new Field('.js-input', '.js-form', [() => fieldValidationResult])],
                submit,
                {
                    validate,
                },
            );

            form.listen();

            const validationResults = await form.validate();

            await waitFor(() => {
                expect(validationResults).toStrictEqual([
                    expectedFieldValidationResult,
                    expectedFormValidationResult,
                ]);
            });
        },
    );

    test('"validate" is called when no fields', async () => {
        const validate = jest.fn();
        validate.mockReturnValue(ValidationResult.valid());
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form'), new Field('.js-checkbox', '.js-form')],
            submit,
            {
                validate,
            },
        );

        await form.validate();

        expect(validate).toHaveBeenCalledTimes(1);
        expect(validate.mock.calls[0][0]).toStrictEqual(new FormData(formElement));
    });
});

describe('submission', () => {
    test('submit valid form', async () => {
        const submitMock = jest.fn();
        submitMock.mockReturnValue(SubmissionResult.positive());
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submitMock,
        );

        form.listen();

        inputElement.value = 'foo';
        getInputElement('.js-checkbox').checked = true;

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(submitMock).toHaveBeenCalledTimes(1);
            expect(submitMock.mock.calls[0][0]).toStrictEqual(new FormData(formElement));
        });
    });

    test('submit invalid form (invalid fields)', async () => {
        const submitMock = jest.fn(() => SubmissionResult.positive());
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submitMock,
        );

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(submitMock).not.toHaveBeenCalled();
        });
    });

    test('submit invalid form (invalid form)', async () => {
        const submitMock = jest.fn(() => SubmissionResult.positive());
        const form = new Form('.js-form', [], submitMock, {
            validate: () => ValidationResult.invalid(),
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(submitMock).not.toHaveBeenCalled();
        });
    });
});

describe('init form', () => {
    test('non-existent element', () => {
        expect(() => new Form('.js-foo', [], submit)).toThrow(Error);
    });
});

describe('statuses', () => {
    test('validating', async () => {
        const onStatusChange = jest.fn();
        const field = new Field('.js-input', '.js-form', [
            () => {
                expect(formElement.classList.contains('ff-form-validating')).toBe(true);
                expect(onStatusChange).toHaveBeenCalledTimes(1);
                expect(onStatusChange.mock.calls[0][0]).toBe('ff-form-validating');
                expect(onStatusChange.mock.calls[0][1]).toStrictEqual([]);
                expect(onStatusChange.mock.calls[0][2]).toBeNull();
                expect(onStatusChange.mock.calls[0][3]).toBe(formElement);
                return ValidationResult.valid();
            },
        ]);

        const form = new Form('.js-form', [field], submit, {
            onStatusChange,
        });

        await form.validate();
    });

    test('valid', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onStatusChange,
            },
        );

        inputElement.value = 'foo';
        getInputElement('.js-checkbox').checked = true;

        await form.validate();

        expect(formElement.classList.contains('ff-form-valid')).toBe(true);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-form-valid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual([
            ValidationResult.valid(),
            ValidationResult.valid(),
            ValidationResult.valid(),
        ]);
        expect(onStatusChange.mock.calls[1][2]).toBeNull();
        expect(onStatusChange.mock.calls[1][3]).toBe(formElement);
    });

    test('invalid', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onStatusChange,
            },
        );

        inputElement.value = 'foo';

        await form.validate();

        expect(formElement.classList.contains('ff-form-invalid')).toBe(true);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-form-invalid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual([
            ValidationResult.valid(),
            ValidationResult.invalid(defaultInvalidValueMessage),
            ValidationResult.invalid(),
        ]);
        expect(onStatusChange.mock.calls[1][2]).toBeNull();
        expect(onStatusChange.mock.calls[1][3]).toBe(formElement);
    });

    test('submitting', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                expect(formElement.classList.contains('ff-form-submitting')).toBe(true);
                expect(onStatusChange).toHaveBeenCalledTimes(4);
                expect(onStatusChange.mock.calls[3][0]).toBe('ff-form-submitting');
                expect(onStatusChange.mock.calls[3][1]).toStrictEqual([
                    ValidationResult.valid(),
                    ValidationResult.valid(),
                ]);
                expect(onStatusChange.mock.calls[3][2]).toBeNull();
                expect(onStatusChange.mock.calls[3][3]).toBe(formElement);
                return SubmissionResult.positive();
            },
            {
                onStatusChange,
            },
        );
        form.listen();

        inputElement.value = 'foo';

        fireEvent.submit(formElement);
    });

    test('positive submit', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => SubmissionResult.positive(),
            {
                onStatusChange,
            },
        );
        form.listen();

        inputElement.value = 'foo';

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-positive-submit')).toBe(true);
            expect(onStatusChange).toHaveBeenCalledTimes(5);
            expect(onStatusChange.mock.calls[4][0]).toBe('ff-form-positive-submit');
            expect(onStatusChange.mock.calls[4][1]).toStrictEqual([
                ValidationResult.valid(),
                ValidationResult.valid(),
            ]);
            expect(onStatusChange.mock.calls[4][2]).toStrictEqual(SubmissionResult.positive());
            expect(onStatusChange.mock.calls[4][3]).toBe(formElement);
        });
    });

    test('negative submit', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => SubmissionResult.negative(),
            {
                onStatusChange,
            },
        );
        form.listen();

        inputElement.value = 'foo';

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-negative-submit')).toBe(true);
            expect(onStatusChange).toHaveBeenCalledTimes(5);
            expect(onStatusChange.mock.calls[4][0]).toBe('ff-form-negative-submit');
            expect(onStatusChange.mock.calls[4][1]).toStrictEqual([
                ValidationResult.valid(),
                ValidationResult.valid(),
            ]);
            expect(onStatusChange.mock.calls[4][2]).toStrictEqual(SubmissionResult.negative());
            expect(onStatusChange.mock.calls[4][3]).toBe(formElement);
        });
    });

    test('status is reset on change', () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onStatusChange,
            onStatusReset,
        });
        form.listen();

        formElement.classList.add('ff-form-valid', 'ff-form-invalid');

        fireEvent.change(inputElement);

        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
        expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(1);
        expect(onStatusChange.mock.calls[0][0]).toBe('');
        expect(onStatusChange.mock.calls[0][1]).toStrictEqual([]);
        expect(onStatusChange.mock.calls[0][2]).toBeNull();
        expect(onStatusChange.mock.calls[0][3]).toBe(formElement);
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(formElement);
    });

    test('status is reset on type', () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onStatusChange,
            onStatusReset,
        });
        form.listen();

        formElement.classList.add('ff-form-valid', 'ff-form-invalid');

        fireEvent.keyUp(inputElement);

        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
        expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(1);
        expect(onStatusChange.mock.calls[0][0]).toBe('');
        expect(onStatusChange.mock.calls[0][1]).toStrictEqual([]);
        expect(onStatusChange.mock.calls[0][2]).toBeNull();
        expect(onStatusChange.mock.calls[0][3]).toBe(formElement);
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(formElement);
    });

    test('status is reset on validation error (field)', async () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', [
                    () => {
                        throw new Error('foo');
                    },
                ]),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
            {
                onStatusChange,
                onStatusReset,
            },
        );

        await form.validate().catch(() => {});

        expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual([]);
        expect(onStatusChange.mock.calls[1][2]).toBeNull();
        expect(onStatusChange.mock.calls[1][3]).toBe(formElement);
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(formElement);
    });

    test('status is reset on validation error (form)', async () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form('.js-form', [], submit, {
            validate: () => {
                throw new Error('foo');
            },
            onStatusChange,
            onStatusReset,
        });

        await form.validate().catch(() => {});

        expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual([]);
        expect(onStatusChange.mock.calls[1][2]).toBeNull();
        expect(onStatusChange.mock.calls[1][3]).toBe(formElement);
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(formElement);
    });

    test('status is reset on submit', async () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onStatusChange,
            onStatusReset,
        });
        form.listen();

        formElement.classList.add('ff-form-valid', 'ff-form-invalid');

        fireEvent.submit(inputElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-valid')).toBe(false);
            expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
            expect(onStatusChange).toHaveBeenCalledTimes(5);
            expect(onStatusChange.mock.calls[0][0]).toBe('');
            expect(onStatusChange.mock.calls[0][1]).toStrictEqual([]);
            expect(onStatusChange.mock.calls[0][2]).toBeNull();
            expect(onStatusChange.mock.calls[0][3]).toBe(formElement);
            expect(onStatusReset).toHaveBeenCalledTimes(1);
            expect(onStatusReset.mock.calls[0][0]).toBe(formElement);
        });
    });

    test('status is "valid" on submission error', async () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                throw new Error('foo');
            },
            {
                onStatusChange,
                onStatusReset,
            },
        );
        form.validationResults = [ValidationResult.valid(), ValidationResult.valid()];
        form.listen();

        formElement.classList.add('ff-form-valid', 'ff-form-invalid');

        inputElement.value = 'foo';

        await form.runSubmitProcess().catch(() => {});

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-valid')).toBe(true);
            expect(formElement.classList.contains('ff-form-positive-submit')).toBe(false);
            expect(formElement.classList.contains('ff-form-negative-submit')).toBe(false);
            expect(formElement.classList.contains('ff-form-valid')).toBe(true);
            expect(onStatusChange).toHaveBeenCalledTimes(2);
            expect(onStatusChange.mock.calls[1][0]).toBe('ff-form-valid');
            expect(onStatusChange.mock.calls[1][1]).toStrictEqual([
                ValidationResult.valid(),
                ValidationResult.valid(),
            ]);
            expect(onStatusChange.mock.calls[1][2]).toBeNull();
            expect(onStatusChange.mock.calls[1][3]).toBe(formElement);
            expect(onStatusReset).not.toHaveBeenCalled();
        });
    });

    test('positive submit, CSS status disabled', async () => {
        const onStatusChange = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => SubmissionResult.positive(),
            {
                onStatusChange,
                cssStatusEnabled: false,
            },
        );
        form.listen();

        inputElement.value = 'foo';

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-positive-submit')).toBe(false);
            expect(onStatusChange).toHaveBeenCalledTimes(5);
            expect(onStatusChange.mock.calls[4][0]).toBe('ff-form-positive-submit');
            expect(onStatusChange.mock.calls[4][1]).toStrictEqual([
                ValidationResult.valid(),
                ValidationResult.valid(),
            ]);
            expect(onStatusChange.mock.calls[4][2]).toStrictEqual(SubmissionResult.positive());
            expect(onStatusChange.mock.calls[4][3]).toBe(formElement);
        });
    });
});

describe('rejection', () => {
    test('reject validation when new field validation starts', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-form', [() => ValidationResult.valid()]);
        const form = new Form('.js-form', [field], () => SubmissionResult.positive(), {
            onAfterValidate,
        });

        form.validate().catch(() => {});
        form.validate().catch(() => {});
        form.validate();

        await waitFor(() => {
            expect(onAfterValidate).toHaveBeenCalledTimes(1);
        });
    });

    test('reject validation when new form validation starts', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-form');
        const form = new Form('.js-form', [field], () => SubmissionResult.positive(), {
            onAfterValidate,
            validate: () => ValidationResult.valid(),
        });

        form.validate().catch(() => {});
        form.validate().catch(() => {});
        form.validate();

        await waitFor(() => {
            expect(onAfterValidate).toHaveBeenCalledTimes(1);
        });
    });

    test('reject submission when new validation starts', async () => {
        const onAfterValidate = jest.fn();
        const onAfterSubmit = jest.fn();
        const field = new Field('.js-input', '.js-form', [() => ValidationResult.valid()]);
        const form = new Form('.js-form', [field], () => SubmissionResult.positive(), {
            onAfterValidate,
            onAfterSubmit,
        });

        form.runSubmitProcess().catch(() => {});
        form.validate();

        await waitFor(() => {
            expect(onAfterValidate).toHaveBeenCalledTimes(1);
            expect(onAfterSubmit).toHaveBeenCalledTimes(0);
        });
    });

    test('reject submission when new submission starts', async () => {
        const onAfterSubmit = jest.fn();
        const form = new Form('.js-form', [], () => SubmissionResult.positive(), {
            onAfterSubmit,
        });

        form.runSubmitProcess().catch(() => {});
        form.runSubmitProcess();

        await waitFor(() => {
            expect(onAfterSubmit).toHaveBeenCalledTimes(1);
        });
    });
});
