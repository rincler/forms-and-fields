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
    });

    test('form options do not override field options', () => {
        const invalidMessages = { required: 'this field is required' };
        const defaultInvalidMessage = 'some field default invalid message';
        const trimEnabled = true;
        const typingDelay = 2;
        const validateOnChange = true;
        const validateOnType = true;
        const validatorParams = { bar: [] };

        const inputField = new Field('.js-input', '.js-form', [], {
            invalidMessages,
            defaultInvalidMessage,
            trimEnabled,
            typingDelay,
            validateOnChange,
            validateOnType,
            validatorParams,
        });

        // eslint-disable-next-line no-new
        new Form('.js-form', [inputField], {
            invalidMessages: { required: 'this is required' },
            defaultInvalidMessage: 'some default invalid message',
            validateOnChange: false,
            validateOnType: false,
            typingDelay: 3,
            onTypingStart: jest.fn(),
            onTypingEnd: jest.fn(),
            onChange: jest.fn(),
            validatorParams: { foo: [] },
            trimEnabled: false,
        });

        expect(inputField.getOption('invalidMessages')).toBe(invalidMessages);
        expect(inputField.getOption('defaultInvalidMessage')).toBe(defaultInvalidMessage);
        expect(inputField.getOption('trimEnabled')).toBe(trimEnabled);
        expect(inputField.getOption('typingDelay')).toBe(typingDelay);
        expect(inputField.getOption('validateOnChange')).toBe(validateOnChange);
        expect(inputField.getOption('validateOnType')).toBe(validateOnType);
        expect(inputField.getOption('validatorParams')).toBe(validatorParams);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', [], {
                    onChange,
                }),
            ],
            {
                onChangeField: onChange,
            }
        );
        form.listen();

        input.value = 'foo';

        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBe(formElement);
        expect(onChange.mock.calls[1][0]).toBe('bar');
        expect(onChange.mock.calls[1][1]).toBe(input);
        expect(onChange.mock.calls[1][2]).toBe(formElement);
    });

    test('"onChangeField" is called on text input (one of the list) change', () => {
        const onChangeField = jest.fn();
        const form = new Form('.js-form', [new Field('.js-list-input', '.js-form')], {
            onChangeField,
        });
        form.listen();

        const listInput = document.querySelectorAll('.js-list-input');
        listInput[2].value = 'foo';

        fireEvent.change(listInput[2], { target: { value: 'bar' } });

        expect(onChangeField).toHaveBeenCalled();
        expect(onChangeField.mock.calls[0][0]).toBe('bar');
        expect(onChangeField.mock.calls[0][1]).toBe(listInput[2]);
        expect(onChangeField.mock.calls[0][2]).toBe(formElement);
    });

    test('"onChangeField" is called on radio input change', () => {
        const onChangeField = jest.fn();
        const form = new Form('.js-form', [new Field('.js-radio', '.js-form')], {
            onChangeField,
        });
        form.listen();

        const radio = document.querySelectorAll('.js-radio');

        fireEvent.click(radio[1]);

        expect(onChangeField).toHaveBeenCalled();
        expect(onChangeField.mock.calls[0][0]).toBe('2');
        expect(onChangeField.mock.calls[0][1]).toBe(radio[1]);
        expect(onChangeField.mock.calls[0][2]).toBe(formElement);
    });

    test('"onTypingStart" is called on text input change', () => {
        const onTypingStart = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', [], {
                    onTypingStart,
                }),
            ],
            {
                onTypingStartField: onTypingStart,
            }
        );
        form.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });

        expect(onTypingStart).toHaveBeenCalledTimes(2);
    });

    test('"onTypingEnd" is called on text input change', () => {
        const onTypingEnd = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', [], {
                    onTypingEnd,
                }),
            ],
            {
                onTypingEndField: onTypingEnd,
            }
        );
        form.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
        jest.runAllTimers();

        expect(onTypingEnd).toHaveBeenCalledTimes(2);
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

    test('"onBeforeValidateField" is not called because of no validators', async () => {
        const onBeforeValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', []), new Field('.js-checkbox', '.js-form', [])],
            {
                onBeforeValidateField,
            }
        );

        await form.validate();

        expect(onBeforeValidateField).not.toHaveBeenCalled();
    });

    test('"onBeforeValidateField" is not called because of no fields', async () => {
        const onBeforeValidateField = jest.fn();
        const form = new Form('.js-form', [], {
            onBeforeValidateField,
        });

        await form.validate();

        expect(onBeforeValidateField).not.toHaveBeenCalled();
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

    test('"onAfterValidateField" is not called because of no validators', async () => {
        const onAfterValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', '.js-form', []), new Field('.js-checkbox', '.js-form', [])],
            {
                onAfterValidateField,
            }
        );

        await form.validate();

        expect(onAfterValidateField).not.toHaveBeenCalled();
    });

    test('"onAfterValidateField" is not called because of no fields', async () => {
        const onAfterValidateField = jest.fn();
        const form = new Form('.js-form', [], {
            onAfterValidateField,
        });

        await form.validate();

        expect(onAfterValidateField).not.toHaveBeenCalled();
    });

    test('"onBeforeValidate" is called', async () => {
        const onBeforeValidateForm = jest.fn();
        const onBeforeValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required'], {
                    onBeforeValidate: onBeforeValidateField,
                }),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onBeforeValidate: onBeforeValidateForm,
            }
        );

        await form.validate();

        expect(onBeforeValidateForm).toHaveBeenCalledTimes(1);
        expect(onBeforeValidateForm.mock.calls[0][0]).toBe(formElement);

        expect(onBeforeValidateField).toHaveBeenCalledTimes(1);
        expect(onBeforeValidateField.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
    });

    test('"onBeforeValidate" is called on text input change', async () => {
        const onBeforeValidateForm = jest.fn();
        const onBeforeValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required'], {
                    onBeforeValidate: onBeforeValidateField,
                    validateOnChange: true,
                }),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onBeforeValidate: onBeforeValidateForm,
            }
        );
        form.listen();

        fireEvent.change(input, 'foo');

        expect(onBeforeValidateForm).toHaveBeenCalledTimes(1);
        expect(onBeforeValidateForm.mock.calls[0][0]).toBe(formElement);

        expect(onBeforeValidateField).toHaveBeenCalledTimes(1);
        expect(onBeforeValidateField.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidateField.mock.calls[0][1]).toBe(formElement);
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
        const onAfterValidateForm = jest.fn();
        const onAfterValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required'], {
                    onAfterValidate: onAfterValidateField,
                }),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onAfterValidate: onAfterValidateForm,
            }
        );

        await form.validate();

        expect(onAfterValidateForm).toHaveBeenCalledTimes(1);
        expect(onAfterValidateForm.mock.calls[0][0]).toBe(false);
        expect(onAfterValidateForm.mock.calls[0][1]).toBe(formElement);

        expect(onAfterValidateField).toHaveBeenCalledTimes(1);
        expect(onAfterValidateField.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterValidateField.mock.calls[0][1]).toBe(input);
        expect(onAfterValidateField.mock.calls[0][2]).toBe(formElement);
    });

    test('"onAfterValidate" is called on text input change', async () => {
        const onAfterValidateForm = jest.fn();
        const onAfterValidateField = jest.fn();
        const form = new Form(
            '.js-form',
            [
                new Field('.js-input', '.js-form', ['required'], {
                    onAfterValidate: onAfterValidateField,
                    validateOnChange: true,
                }),
                new Field('.js-checkbox', '.js-form', ['required']),
                new Field('.js-textarea', '.js-form', []),
            ],
            {
                onAfterValidate: onAfterValidateForm,
            }
        );
        form.listen();

        fireEvent.change(input, 'foo');

        await waitFor(() => {
            expect(onAfterValidateForm).toHaveBeenCalledTimes(1);
            expect(onAfterValidateForm.mock.calls[0][0]).toBe(false);
            expect(onAfterValidateForm.mock.calls[0][1]).toBe(formElement);

            expect(onAfterValidateField).toHaveBeenCalledTimes(1);
            expect(onAfterValidateField.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
            expect(onAfterValidateField.mock.calls[0][1]).toBe(input);
            expect(onAfterValidateField.mock.calls[0][2]).toBe(formElement);
        });
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
        expect.assertions(2);

        const field = new Field('.js-input', '.js-form', [
            (value) => {
                expect(formElement.classList.contains('f-form-validating')).toBe(true);
                return new ValidationResult(value === '12345');
            },
        ]);

        const form = new Form('.js-form', [field]);

        input.value = '1234';

        await form.validate();
        await field.validate();
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
