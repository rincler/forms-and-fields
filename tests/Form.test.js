/**
 * @jest-environment jsdom
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import Field from '../src/Field';
import Form from '../src/Form';
import ValidationResult from '../src/ValidationResult';
import SubmissionResult from '../src/SubmissionResult';

let formElement = null;
let input = null;
jest.useFakeTimers();

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
            <select multiple class="js-multi-select" name="multi-select-name">
                <option value="1"></option>
                <option value="2"></option>
            </select>
            <textarea class="js-textarea" name="textarea-name"></textarea>
        </form>`;

    formElement = document.querySelector('.js-form');
    input = document.querySelector('.js-input');
});

describe('field options', () => {
    test('pass options to fields', () => {
        const invalidMessages = { required: 'this is required' };
        const defaultInvalidMessage = 'some default invalid message';
        const validateOnChange = true;
        const validateOnType = true;
        const typingDelay = 3;
        const validatorParams = { foo: [] };
        const trimEnabled = false;
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();

        const inputField = new Field('.js-input', '.js-form');
        const checkboxField = new Field('.js-checkbox', '.js-form');

        // eslint-disable-next-line no-new
        new Form('.js-form', [inputField, checkboxField], {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
            onChange,
            onTypingStart,
            onTypingEnd,
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

        expect(inputField.getOption('onChange')).toBe(onChange);
        expect(checkboxField.getOption('onChange')).toBe(onChange);

        expect(inputField.getOption('onTypingStart')).toBe(onTypingStart);
        expect(checkboxField.getOption('onTypingStart')).toBe(onTypingStart);

        expect(inputField.getOption('onTypingEnd')).toBe(onTypingEnd);
        expect(checkboxField.getOption('onTypingEnd')).toBe(onTypingEnd);
    });

    test('form options do not override field options', () => {
        const invalidMessages = { required: 'this field is required' };
        const defaultInvalidMessage = 'some field default invalid message';
        const trimEnabled = true;
        const typingDelay = 2;
        const validateOnChange = true;
        const validateOnType = true;
        const validatorParams = { bar: [] };
        const onChange = jest.fn();
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();

        const inputField = new Field('.js-input', '.js-form', [], {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
            onChange,
            onTypingStart,
            onTypingEnd,
        });

        // eslint-disable-next-line no-new
        new Form('.js-form', [inputField], {
            invalidMessages: { required: 'this is required' },
            defaultInvalidMessage: 'some default invalid message',
            trimEnabled: false,
            typingDelay: 3,
            validateOnChange: false,
            validateOnType: false,
            validatorParams: { foo: [] },
            onChange: jest.fn(),
            onTypingStart: jest.fn(),
            onTypingEnd: jest.fn(),
        });

        expect(inputField.getOption('invalidMessages')).toBe(invalidMessages);
        expect(inputField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);
        expect(inputField.getOption('trimEnabled')).toBe(trimEnabled);
        expect(inputField.getOption('typingDelay')).toBe(typingDelay);
        expect(inputField.getOption('validateOnChange')).toBe(validateOnChange);
        expect(inputField.getOption('validateOnType')).toBe(validateOnType);
        expect(inputField.getOption('validatorParams')).toBe(validatorParams);
        expect(inputField.getOption('onChange')).toBe(onChange);
        expect(inputField.getOption('onTypingStart')).toBe(onTypingStart);
        expect(inputField.getOption('onTypingEnd')).toBe(onTypingEnd);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const form = new Form('.js-form', [new Field('.js-input', '.js-form', [])], {
            onChange,
        });
        form.listen();

        input.value = 'foo';

        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalled();
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
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onBeforeValidateField,
            }
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
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onAfterValidateField,
            }
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

    test('"onBeforeValidate" is called', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required']),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onBeforeValidate,
            }
        );

        await form.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(formElement);
    });

    test('"onBeforeValidate" is not called because of no validators', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', []), new Field('.js-checkbox', '.js-form', [])],
            {
                onBeforeValidate,
            }
        );

        await form.validate();

        expect(onBeforeValidate).not.toHaveBeenCalled();
    });

    test('"onBeforeValidate" is not called because of no fields', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form('.js-form', [], {
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
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onAfterValidate,
            }
        );

        await form.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toBe(false);
        expect(onAfterValidate.mock.calls[0][1]).toBe(formElement);
    });

    test('"onAfterValidate" is not called because of no validators', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', []), new Field('.js-checkbox', '.js-form', [])],
            {
                onAfterValidate,
            }
        );

        await form.validate();

        expect(onAfterValidate).not.toHaveBeenCalled();
    });

    test('"onAfterValidate" is not called because of no fields', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form('.js-form', [], {
            onAfterValidate,
        });

        await form.validate();

        expect(onAfterValidate).not.toHaveBeenCalled();
    });

    test('"onBeforeSubmit" is called', () => {
        const onBeforeSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required']), new Field('.js-checkbox', '.js-form', ['required'])],
            {
                onBeforeSubmit,
                submit: () => new SubmissionResult(true),
            }
        );

        form.listen();

        fireEvent.submit(formElement);

        expect(onBeforeSubmit).toHaveBeenCalledTimes(1);
        expect(onBeforeSubmit.mock.calls[0][0]).toBeInstanceOf(FormData);
        expect(onBeforeSubmit.mock.calls[0][1]).toBe(formElement);
    });
});

describe('submit callback options', () => {
    test('"onBeforeSubmit" is not called because of no submit callback', () => {
        const onBeforeSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required']), new Field('.js-checkbox', '.js-form', ['required'])],
            {
                onBeforeSubmit,
            }
        );

        form.listen();

        fireEvent.submit(formElement);

        expect(onBeforeSubmit).not.toHaveBeenCalled();
    });

    test('"onAfterSubmit" is called with submission result', async () => {
        const onAfterSubmit = jest.fn();
        const form = new Form('.js-form', [], {
            submit: () => new SubmissionResult(true),
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

    test('"onAfterSubmit" is not called because of no submit callback', async () => {
        const onAfterSubmit = jest.fn();
        const onAfterSubmitSuccess = jest.fn();
        const onAfterSubmitError = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required']), new Field('.js-checkbox', '.js-form', ['required'])],
            {
                onAfterSubmit,
                onAfterSubmitSuccess,
                onAfterSubmitError,
            }
        );

        form.listen();

        input.value = 'foo';
        document.querySelector('.js-checkbox').checked = true;

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmit).not.toHaveBeenCalled();
            expect(onAfterSubmitSuccess).not.toHaveBeenCalled();
            expect(onAfterSubmitError).not.toHaveBeenCalled();
        });
    });

    test('"onAfterSubmit" is not called because of invalid form', () => {
        const onAfterSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required']), new Field('.js-checkbox', '.js-form', ['required'])],
            {
                onAfterSubmit,
                submit: () => new SubmissionResult(true),
            }
        );

        form.listen();

        fireEvent.submit(formElement);

        expect(onAfterSubmit).not.toHaveBeenCalled();
    });

    test('"onAfterSubmitSuccess" is called and "onAfterSubmitError" is not called', async () => {
        const onAfterSubmitSuccess = jest.fn();
        const onAfterSubmitError = jest.fn();
        const form = new Form('.js-form', [], {
            submit: () => new SubmissionResult(true, { foo: 'bar' }),
            onAfterSubmitSuccess,
            onAfterSubmitError,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmitSuccess).toHaveBeenCalledTimes(1);
            expect(onAfterSubmitSuccess.mock.calls[0][0]).toStrictEqual({ foo: 'bar' });
            expect(onAfterSubmitSuccess.mock.calls[0][1]).toBe(formElement);
            expect(onAfterSubmitError).not.toHaveBeenCalled();
        });
    });

    test('"onAfterSubmitSuccess" is not called and "onAfterSubmitError" is called', async () => {
        const onAfterSubmitSuccess = jest.fn();
        const onAfterSubmitError = jest.fn();
        const form = new Form('.js-form', [], {
            submit: () => new SubmissionResult(false, { foo: 'bar' }),
            onAfterSubmitSuccess,
            onAfterSubmitError,
        });

        form.listen();

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmitSuccess).not.toHaveBeenCalled();
            expect(onAfterSubmitError).toHaveBeenCalledTimes(1);
            expect(onAfterSubmitError.mock.calls[0][0]).toStrictEqual({ foo: 'bar' });
            expect(onAfterSubmitError.mock.calls[0][1]).toBe(formElement);
        });
    });

    test('"submit" is called', async () => {
        const submit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', ['required']), new Field('.js-checkbox', '.js-form', ['required'])],
            {
                submit,
            }
        );

        form.listen();

        input.value = 'foo';
        document.querySelector('.js-checkbox').checked = true;

        fireEvent.submit(formElement);

        const formData = new FormData(formElement);

        await waitFor(() => {
            expect(submit).toHaveBeenCalledTimes(1);
            expect(submit.mock.calls[0][0]).toStrictEqual(formData);
            expect(submit.mock.calls[0][1]).toBe(formElement);
        });
    });
});

describe('validation', () => {
    test('"isValid"', async () => {
        const validateFn = jest.fn(() => new ValidationResult(true));
        const form = new Form('.js-form', [
            new Field('.js-input', '.js-form', [validateFn]),
            new Field('.js-radio', '.js-form', [validateFn]),
            new Field('.js-list-input', '.js-form', [validateFn]),
            new Field('.js-no', '.js-form', [validateFn]),
        ]);

        await form.isValid(true);

        expect(validateFn).toHaveBeenCalledTimes(5);
    });

    test('"validate"', async () => {
        const validateFn = jest.fn(() => new ValidationResult(true));
        const form = new Form('.js-form', [
            new Field('.js-input', '.js-form', [validateFn]),
            new Field('.js-radio', '.js-form', [validateFn]),
            new Field('.js-list-input', '.js-form', [validateFn]),
            new Field('.js-no', '.js-form', [validateFn]),
        ]);

        await form.validate();

        expect(validateFn).toHaveBeenCalledTimes(5);
    });
});

describe('init form', () => {
    test('non-existent element', () => {
        expect(() => new Form('.js-foo')).toThrow(Error);
    });
});

describe('special css classes', () => {
    test('validating special css class', async () => {
        const field = new Field('.js-input', '.js-form', [
            (value) => {
                expect(formElement.classList.contains('f-form-validating')).toBe(true);
                return new ValidationResult(value === '12345');
            },
        ]);

        const form = new Form('.js-form', [field]);

        input.value = '1234';

        await form.validate();
    });

    test('valid special css class', async () => {
        const form = new Form('.js-form', [
            new Field('.js-input', '.js-form', ['required']),
            new Field('.js-checkbox', '.js-form', ['required']),
        ]);

        input.value = 'foo';
        document.querySelector('.js-checkbox').checked = true;

        await form.validate();

        expect(formElement.classList.contains('f-form-valid')).toBe(true);
    });

    test('invalid special css class', async () => {
        const form = new Form('.js-form', [
            new Field('.js-input', '.js-form', ['required']),
            new Field('.js-checkbox', '.js-form', ['required']),
        ]);

        input.value = 'foo';

        await form.validate();

        expect(formElement.classList.contains('f-form-invalid')).toBe(true);
    });
});
