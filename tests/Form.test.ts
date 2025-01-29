import { fireEvent, waitFor } from '@testing-library/dom';
import Field from '../src/Field';
import Form from '../src/Form';
import ValidationResult from '../src/ValidationResult';
import SubmissionResult from '../src/SubmissionResult';
import { FormStatus } from '../src/types';

// @ts-expect-error It will not be `null` after the `beforeEach`.
let formElement: HTMLFormElement = null;
// @ts-expect-error It will not be `null` after the `beforeEach`.
let input: HTMLInputElement = null;
const submit = () => new SubmissionResult(true);
jest.useFakeTimers();

const getInputElement = (selector: string): HTMLInputElement => {
    return document.querySelector<HTMLInputElement>(selector)!;
};

beforeEach(() => {
    document.body.innerHTML = `
        <form class="js-form">
            <input class="js-input" name="input-name" />
            <input class="js-list-input" name="list-input-name[0]" />
            <input class="js-list-input" name="list-input-name[1]" />
            <input class="js-list-input" name="list-input-name[2]" />
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
    input = getInputElement('.js-input');
});

describe('field options', () => {
    test('pass options to fields', () => {
        const invalidMessages = { required: 'this is required' };
        const defaultInvalidMessage = 'some default invalid message';
        const validateOnChange = true;
        const validateOnType = true;
        const typingDelay = 3;
        const validatorParams = { isEmail: [{ allow_utf8_local_part: false }] };
        const validationCacheEnabled = false;
        const trimEnabled = false;
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const onBeforeValidateField = jest.fn();
        const onAfterValidateField = jest.fn();
        const onFieldValidationError = jest.fn();
        const onResetFieldStatus = jest.fn();
        const setFieldStatus = jest.fn();

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
            onChange,
            onTypingStart,
            onTypingEnd,
            onBeforeValidateField,
            onAfterValidateField,
            onFieldValidationError,
            onResetFieldStatus,
            setFieldStatus,
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

        expect(inputField.getOption('onResetStatus')).toBe(onResetFieldStatus);
        expect(checkboxField.getOption('onResetStatus')).toBe(onResetFieldStatus);

        expect(inputField.getOption('setStatus')).toBe(setFieldStatus);
        expect(checkboxField.getOption('setStatus')).toBe(setFieldStatus);
    });

    test('form options do not override field options', () => {
        const invalidMessages = { required: 'this field is required' };
        const defaultInvalidMessage = 'some field default invalid message';
        const trimEnabled = true;
        const typingDelay = 2;
        const validateOnChange = true;
        const validateOnType = true;
        const validatorParams = { bar: [] };
        const validationCacheEnabled = false;
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const onBeforeValidate = jest.fn();
        const onAfterValidate = jest.fn();
        const onValidationError = jest.fn();
        const onResetStatus = jest.fn();
        const setStatus = jest.fn();

        const inputField = new Field('.js-input', '.js-form', [], {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
            validationCacheEnabled,
            onChange,
            onTypingStart,
            onTypingEnd,
            onBeforeValidate,
            onAfterValidate,
            onValidationError,
            onResetStatus,
            setStatus,
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
            onChange: jest.fn(),
            onTypingStart: jest.fn(),
            onTypingEnd: jest.fn(),
            onBeforeValidateField: jest.fn(),
            onAfterValidateField: jest.fn(),
            onFieldValidationError: jest.fn(),
            onResetFieldStatus: jest.fn(),
            setFieldStatus: jest.fn(),
        });

        expect(inputField.getOption('invalidMessages')).toBe(invalidMessages);
        expect(inputField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);
        expect(inputField.getOption('trimEnabled')).toBe(trimEnabled);
        expect(inputField.getOption('typingDelay')).toBe(typingDelay);
        expect(inputField.getOption('validateOnChange')).toBe(validateOnChange);
        expect(inputField.getOption('validateOnType')).toBe(validateOnType);
        expect(inputField.getOption('validatorParams')).toBe(validatorParams);
        expect(inputField.getOption('validationCacheEnabled')).toBe(validationCacheEnabled);
        expect(inputField.getOption('onChange')).toBe(onChange);
        expect(inputField.getOption('onTypingStart')).toBe(onTypingStart);
        expect(inputField.getOption('onTypingEnd')).toBe(onTypingEnd);
        expect(inputField.getOption('onBeforeValidate')).toBe(onBeforeValidate);
        expect(inputField.getOption('onAfterValidate')).toBe(onAfterValidate);
        expect(inputField.getOption('onValidationError')).toBe(onValidationError);
        expect(inputField.getOption('onResetStatus')).toBe(onResetStatus);
        expect(inputField.getOption('setStatus')).toBe(setStatus);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            onChange,
        });
        form.listen();

        input.value = 'foo';

        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBe(formElement);
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
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onBeforeValidateField,
            },
        );

        await form.validate();

        const checkbox = document.querySelector('.js-checkbox');

        expect(onBeforeValidateField).toHaveBeenCalledTimes(2);
        expect(onBeforeValidateField.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
        expect(onBeforeValidateField.mock.calls[1][0]).toBe(checkbox);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
    });

    test('"onAfterValidateField" is called', async () => {
        const onAfterValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form'),
            ],
            submit,
            {
                onAfterValidateField,
            },
        );

        await form.validate();

        const checkbox = document.querySelector('.js-checkbox');

        expect(onAfterValidateField).toHaveBeenCalledTimes(2);
        expect(onAfterValidateField.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterValidateField.mock.calls[0][1]).toBe(input);
        expect(onAfterValidateField.mock.calls[0][2]).toBe(formElement);
        expect(onAfterValidateField.mock.calls[1][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterValidateField.mock.calls[1][1]).toBe(checkbox);
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

    test('"onBeforeValidate" is not called because of no validators', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form'), new Field('.js-checkbox', '.js-form')],
            submit,
            {
                onBeforeValidate,
            },
        );

        await form.validate();

        expect(onBeforeValidate).not.toHaveBeenCalled();
    });

    test('"onBeforeValidate" is not called because of no fields', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form('.js-form', [], submit, {
            onBeforeValidate,
        });

        await form.validate();

        expect(onBeforeValidate).not.toHaveBeenCalled();
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
            ValidationResult.invalid('Invalid value.'),
            ValidationResult.invalid('Invalid value.'),
            ValidationResult.valid(),
            ValidationResult.invalid(),
        ]);
        expect(onAfterValidate.mock.calls[0][1]).toBe(formElement);
    });

    test('"onAfterValidate" is not called because of no validators', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form'), new Field('.js-checkbox', '.js-form')],
            submit,
            {
                onAfterValidate,
            },
        );

        await form.validate();

        expect(onAfterValidate).not.toHaveBeenCalled();
    });

    test('"onAfterValidate" is not called because of no fields', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form('.js-form', [], submit, {
            onAfterValidate,
        });

        await form.validate();

        expect(onAfterValidate).not.toHaveBeenCalled();
    });

    test('"onValidationError" is called when validating fields', async () => {
        const onValidationError = jest.fn();
        const onResetStatus = jest.fn();
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
                onResetStatus,
            },
        );

        await expect(form.validate()).rejects.toThrow(error);

        expect(onValidationError).toHaveBeenCalledTimes(1);
        expect(onValidationError.mock.calls[0][0]).toBe(error);
        expect(onValidationError.mock.calls[0][1]).toBe(formElement);
        expect(onResetStatus).toHaveBeenCalledTimes(1);
    });

    test('"onValidationError" is called when validating form', async () => {
        const onValidationError = jest.fn();
        const onResetStatus = jest.fn();
        const error = new Error('foo');
        const form = new Form('.js-form', [], submit, {
            validate: () => {
                throw error;
            },
            onValidationError,
            onResetStatus,
        });

        await expect(form.validate()).rejects.toThrow(error);

        expect(onValidationError).toHaveBeenCalledTimes(1);
        expect(onValidationError.mock.calls[0][0]).toBe(error);
        expect(onValidationError.mock.calls[0][1]).toBe(formElement);
        expect(onResetStatus).toHaveBeenCalledTimes(1);
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
            expect(onAfterSubmit.mock.calls[0][0]).toBeInstanceOf(SubmissionResult);
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

    test('"onAfterPositiveSubmit" is called and "onAfterNegativeSubmit" is not called', async () => {
        const onAfterPositiveSubmit = jest.fn();
        const onAfterNegativeSubmit = jest.fn();
        const form = new Form('.js-form', [], () => new SubmissionResult(true, { foo: 'bar' }), {
            onAfterPositiveSubmit,
            onAfterNegativeSubmit,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterPositiveSubmit).toHaveBeenCalledTimes(1);
            expect(onAfterPositiveSubmit.mock.calls[0][0]).toStrictEqual({ foo: 'bar' });
            expect(onAfterPositiveSubmit.mock.calls[0][1]).toBe(formElement);
            expect(onAfterNegativeSubmit).not.toHaveBeenCalled();
        });
    });

    test('"onAfterPositiveSubmit" is not called and "onAfterNegativeSubmit" is called', async () => {
        const onAfterPositiveSubmit = jest.fn();
        const onAfterNegativeSubmit = jest.fn();
        const form = new Form('.js-form', [], () => new SubmissionResult(false, { foo: 'bar' }), {
            onAfterPositiveSubmit,
            onAfterNegativeSubmit,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterPositiveSubmit).not.toHaveBeenCalled();
            expect(onAfterNegativeSubmit).toHaveBeenCalledTimes(1);
            expect(onAfterNegativeSubmit.mock.calls[0][0]).toStrictEqual({ foo: 'bar' });
            expect(onAfterNegativeSubmit.mock.calls[0][1]).toBe(formElement);
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
                    new Field('.js-list-input', '.js-form', [validateFn]),
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
        submitMock.mockReturnValue(new SubmissionResult(true));
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submitMock,
        );

        form.listen();

        input.value = 'foo';
        getInputElement('.js-checkbox').checked = true;

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(submitMock).toHaveBeenCalledTimes(1);
            expect(submitMock.mock.calls[0][0]).toStrictEqual(new FormData(formElement));
        });
    });

    test('submit invalid form (invalid fields)', async () => {
        const submitMock = jest.fn(() => new SubmissionResult(true));
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
        const submitMock = jest.fn(() => new SubmissionResult(true));
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
        const field = new Field('.js-input', '.js-form', [
            () => {
                expect(formElement.classList.contains('ff-form-validating')).toBe(true);
                return ValidationResult.valid();
            },
        ]);

        const form = new Form('.js-form', [field], submit);

        input.value = 'foo';

        await form.validate();
    });

    test('valid', async () => {
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
        );

        input.value = 'foo';
        getInputElement('.js-checkbox').checked = true;

        await form.validate();

        expect(formElement.classList.contains('ff-form-valid')).toBe(true);
    });

    test('invalid', async () => {
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
            ],
            submit,
        );

        input.value = 'foo';

        await form.validate();

        expect(formElement.classList.contains('ff-form-invalid')).toBe(true);
    });

    test('no status when validation error', async () => {
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
        );

        await form.validate().catch(() => {});

        expect(formElement.classList.contains('ff-form-invalid')).toBe(false);
        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
    });

    test('submitting', async () => {
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                expect(formElement.classList.contains('ff-form-submitting')).toBe(true);
                return new SubmissionResult(true);
            },
        );
        form.listen();

        input.value = 'foo';

        fireEvent.submit(formElement);
    });

    test('positive submit', async () => {
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                return new SubmissionResult(true);
            },
        );
        form.listen();

        input.value = 'foo';

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-positive-submit')).toBe(true);
        });
    });

    test('negative submit', async () => {
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                return new SubmissionResult(false);
            },
        );
        form.listen();

        input.value = 'foo';

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-negative-submit')).toBe(true);
        });
    });

    test('valid when submit error', async () => {
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            () => {
                throw new Error('foo');
            },
        );
        form.listen();

        input.value = 'foo';

        await form.runSubmitProcess().catch(() => {});

        await waitFor(() => {
            expect(formElement.classList.contains('ff-form-positive-submit')).toBe(false);
            expect(formElement.classList.contains('ff-form-negative-submit')).toBe(false);
            expect(formElement.classList.contains('ff-form-valid')).toBe(true);
        });
    });

    test('custom "setStatus"', async () => {
        const setStatus = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            submit,
            {
                setStatus,
            },
        );

        input.value = 'foo';

        await form.validate();

        expect(setStatus).toHaveBeenCalledTimes(2);
        expect(setStatus.mock.calls[0][0]).toBe('ff-form-validating');
        expect(setStatus.mock.calls[0][1]).toBe(formElement);
        expect(setStatus.mock.calls[1][0]).toBe('ff-form-valid');
        expect(setStatus.mock.calls[1][1]).toBe(formElement);

        expect(formElement.classList.contains('ff-form-valid')).toBe(false);
    });

    test('custom field "setStatus"', async () => {
        const setStatus = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required'])],
            submit,
            {
                setFieldStatus: setStatus,
            },
        );

        input.value = 'foo';

        await form.validate();

        expect(setStatus).toHaveBeenCalledTimes(2);
        expect(setStatus.mock.calls[0][0]).toBe('ff-field-validating');
        expect(setStatus.mock.calls[0][1]).toBe(input);
        expect(setStatus.mock.calls[0][2]).toBe(formElement);
        expect(setStatus.mock.calls[1][0]).toBe('ff-field-valid');
        expect(setStatus.mock.calls[1][1]).toBe(input);
        expect(setStatus.mock.calls[1][2]).toBe(formElement);
        expect(input.classList.contains('ff-field-valid')).toBe(false);
    });

    test('status is reset on change', () => {
        const setStatus = jest.fn();
        const onResetStatus = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            setStatus,
            onResetStatus,
        });
        form.listen();

        fireEvent.change(input, { target: { value: 'bar' } });

        expect(setStatus).toHaveBeenCalledTimes(1);
        expect(setStatus.mock.calls[0][0]).toBe('');
        expect(setStatus.mock.calls[0][1]).toBe(formElement);
        expect(onResetStatus).toHaveBeenCalledTimes(1);
    });

    test('status is reset on type', () => {
        const setStatus = jest.fn();
        const onResetStatus = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form')], submit, {
            setStatus,
            onResetStatus,
        });
        form.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });

        expect(setStatus).toHaveBeenCalledTimes(1);
        expect(setStatus.mock.calls[0][0]).toBe('');
        expect(setStatus.mock.calls[0][1]).toBe(formElement);
        expect(onResetStatus).toHaveBeenCalledTimes(1);
    });

    test('"onResetStatus" is called', () => {
        const onResetStatus = jest.fn();
        const form = new Form('.js-form', [], submit, {
            onResetStatus,
        });
        form.setStatus(FormStatus.No);
        expect(onResetStatus).toHaveBeenCalledTimes(1);
        expect(onResetStatus.mock.calls[0][0]).toBe(formElement);
    });
});

describe('rejection', () => {
    test('reject validation when new field validation starts', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-form', [() => ValidationResult.valid()]);
        const form = new Form('.js-form', [field], () => new SubmissionResult(true), {
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
        const form = new Form('.js-form', [field], () => new SubmissionResult(true), {
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
        const form = new Form('.js-form', [field], () => new SubmissionResult(true), {
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
        const form = new Form('.js-form', [], () => new SubmissionResult(true), {
            onAfterSubmit,
        });

        form.runSubmitProcess().catch(() => {});
        form.runSubmitProcess();

        await waitFor(() => {
            expect(onAfterSubmit).toHaveBeenCalledTimes(1);
        });
    });
});
