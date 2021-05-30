import { fireEvent, waitFor } from '@testing-library/dom';
import Field from '../src/Field';
import Form from '../src/Form';
import ValidationResult from '../src/ValidationResult';
import SubmissionResult from '../src/SubmissionResult';

let formElement = null;
let input = null;
let checkbox = null;
jest.useFakeTimers();

beforeEach(() => {
    const inputHtml = '<input class="js-input" name="input-name">';
    const checkboxHtml = '<input class="js-checkbox" type="checkbox" name="checkbox-name">';
    const radioHtml =
        '<input class="js-radio-1" type="radio" name="radio-name" value="1"><input class="js-radio-2" type="radio" name="radio-name" value="2">';
    const selectHtml =
        '<select class="js-select" name="select-name"><option class="js-select-option-1" value="1"></option><option class="js-select-option-2" value="2"></option></select>';
    const multiSelectHtml = `<select multiple class="js-mselect" name="mselect-name">
            <option class="js-mselect-option-1" value="1"></option>
            <option class="js-mselect-option-2" value="2"></option>
        </select>`;
    const textareaHtml = '<textarea class="js-textarea" name="textarea-name"></textarea>';
    document.body.innerHTML = `<form class="js-form">${inputHtml}${checkboxHtml}${radioHtml}${selectHtml}${multiSelectHtml}${textareaHtml}</form>`;
    formElement = document.querySelector('.js-form');
    input = document.querySelector('.js-input');
    checkbox = document.querySelector('.js-checkbox');
});

describe('test field options', () => {
    test('pass options to fields', () => {
        const invalidMessages = { required: 'this is required' };
        const defaultInvalidMessage = 'some default invalid message';
        const validateOnChange = jest.fn();
        const validateOnType = jest.fn();
        const typingDelay = 3;
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const onChange = jest.fn();
        const validatorParams = { foo: 'bar' };
        const trimEnabled = false;

        const inputField = new Field('.js-input');
        const checkboxField = new Field('.js-checkbox');

        new Form('.js-form', [inputField, checkboxField], {
            invalidMessages,
            defaultInvalidMessage,
            validateOnChange,
            validateOnType,
            typingDelay,
            onTypingStart,
            onTypingEnd,
            onChange,
            validatorParams,
            trimEnabled,
        });

        expect(inputField.invalidMessages).toBe(invalidMessages);
        expect(checkboxField.invalidMessages).toBe(invalidMessages);

        expect(inputField.defaultInvalidMessage).toBe(defaultInvalidMessage);
        expect(checkboxField.defaultInvalidMessage).toBe(defaultInvalidMessage);

        expect(inputField.validateOnChange).toBe(validateOnChange);
        expect(checkboxField.validateOnChange).toBe(validateOnChange);

        expect(inputField.validateOnType).toBe(validateOnType);
        expect(checkboxField.validateOnType).toBe(validateOnType);

        expect(inputField.typingDelay).toBe(typingDelay);
        expect(checkboxField.typingDelay).toBe(typingDelay);

        expect(inputField.onTypingStart).toBe(onTypingStart);
        expect(checkboxField.onTypingStart).toBe(onTypingStart);

        expect(inputField.onTypingEnd).toBe(onTypingEnd);
        expect(checkboxField.onTypingEnd).toBe(onTypingEnd);

        expect(inputField.onChange).toBe(onChange);
        expect(checkboxField.onChange).toBe(onChange);

        expect(inputField.validatorParams).toBe(validatorParams);
        expect(checkboxField.validatorParams).toBe(validatorParams);

        expect(inputField.trimEnabled).toBe(trimEnabled);
        expect(checkboxField.trimEnabled).toBe(trimEnabled);
    });

    test('onChange is called on change', () => {
        const onChange = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onChange,
            }
        );
        form.listen();

        input.value = 'some value';

        fireEvent.change(input, { target: { value: 'some value 2' } });

        expect(onChange.mock.calls[0][0]).toBe('some value 2');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBe(formElement);
    });
});

describe('test callback options', () => {
    test('onBeforeFieldValidate is called', async () => {
        const onBeforeFieldValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onBeforeFieldValidate,
            }
        );

        await form.validate();

        expect(onBeforeFieldValidate).toHaveBeenCalledTimes(2);
        expect(onBeforeFieldValidate.mock.calls[0][0]).toBe(input);
        expect(onBeforeFieldValidate.mock.calls[1][0]).toBe(checkbox);
        expect(onBeforeFieldValidate.mock.calls[0][1]).toBe(formElement);
    });

    test('onAfterFieldValidate is called', async () => {
        const onAfterFieldValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onAfterFieldValidate,
            }
        );

        await form.validate();

        expect(onAfterFieldValidate).toHaveBeenCalledTimes(2);
        expect(onAfterFieldValidate.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterFieldValidate.mock.calls[0][1]).toBe(input);
        expect(onAfterFieldValidate.mock.calls[1][1]).toBe(checkbox);
        expect(onAfterFieldValidate.mock.calls[0][2]).toBe(formElement);
    });

    test('onBeforeValidate is called', async () => {
        const onBeforeValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onBeforeValidate,
            }
        );

        await form.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(formElement);
    });

    test('onAfterValidate is called', async () => {
        const onAfterValidate = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onAfterValidate,
            }
        );

        await form.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toBe(false);
        expect(onAfterValidate.mock.calls[0][1]).toBe(formElement);
    });

    test('onBeforeSubmit is called', () => {
        const onBeforeSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onBeforeSubmit,
            }
        );

        form.listen();

        fireEvent.submit(formElement);

        expect(onBeforeSubmit).toHaveBeenCalledTimes(1);
        expect(onBeforeSubmit.mock.calls[0][0]).toBeInstanceOf(FormData);
        expect(onBeforeSubmit.mock.calls[0][1]).toBe(formElement);
    });

    test('onAfterSubmit is not called because invalid form', () => {
        const onAfterSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onAfterSubmit,
            }
        );

        form.listen();

        fireEvent.submit(formElement);

        expect(onAfterSubmit).not.toHaveBeenCalled();
    });

    test('onAfterSubmit is called', async () => {
        const onAfterSubmit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                onAfterSubmit,
            }
        );

        form.listen();

        input.value = 'some text';
        checkbox.checked = true;

        fireEvent.submit(formElement);

        await waitFor(() => {
            expect(onAfterSubmit).toHaveBeenCalledTimes(1);
            expect(onAfterSubmit.mock.calls[0][0]).toBe(null);
            expect(onAfterSubmit.mock.calls[0][1]).toBe(formElement);
        });
    });

    test('onAfterSubmit is called with submission result', async () => {
        const onAfterSubmit = jest.fn();
        const submit = jest.fn(() => {
            return new SubmissionResult(true);
        });
        const form = new Form('.js-form', [], {
            submit,
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

    test('onAfterSubmitSuccess is called and onAfterSubmitError is not called', async () => {
        const onAfterSubmitSuccess = jest.fn();
        const onAfterSubmitError = jest.fn();
        const submit = jest.fn(() => {
            return new SubmissionResult(true, { foo: 'bar' });
        });
        const form = new Form('.js-form', [], {
            submit,
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

    test('onAfterSubmitSuccess is not called and onAfterSubmitError is called', async () => {
        const onAfterSubmitSuccess = jest.fn();
        const onAfterSubmitError = jest.fn();
        const submit = jest.fn(() => {
            return new SubmissionResult(false, { foo: 'bar' });
        });
        const form = new Form('.js-form', [], {
            submit,
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

    test('submit is called', async () => {
        const submit = jest.fn();
        const form = new Form(
            '.js-form',
            [new Field('.js-input', ['required']), new Field('.js-checkbox', ['required'])],
            {
                submit,
            }
        );

        form.listen();

        input.value = 'some text';
        checkbox.checked = true;

        fireEvent.submit(formElement);

        const formData = new FormData(formElement);

        await waitFor(() => {
            expect(submit).toHaveBeenCalledTimes(1);
            expect(submit.mock.calls[0][0]).toStrictEqual(formData);
            expect(submit.mock.calls[0][1]).toBe(formElement);
        });
    });
});

describe('test init form', () => {
    test('nonexistent element', () => {
        expect(() => new Form('.js-foo')).toThrow(Error);
    });
});

describe('test special css classes', () => {
    test('validating special css class', async () => {
        expect.assertions(2);

        const field = new Field('.js-input', [
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
            new Field('.js-input', ['required']),
            new Field('.js-checkbox', ['required']),
        ]);

        input.value = 'some text';
        checkbox.checked = true;

        await form.validate();

        expect(formElement.classList.contains('f-form-valid')).toBe(true);
    });

    test('invalid special css class', async () => {
        const form = new Form('.js-form', [
            new Field('.js-input', ['required']),
            new Field('.js-checkbox', ['required']),
        ]);

        input.value = 'some text';

        await form.validate();

        expect(formElement.classList.contains('f-form-invalid')).toBe(true);
    });
});
