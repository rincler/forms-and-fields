import { fireEvent } from '@testing-library/dom';
import Field from '../src/Field';
import ValidationResult from '../src/ValidationResult';

let input = null;
let checkbox = null;
let textarea = null;
jest.useFakeTimers();

beforeEach(() => {
    const inputHtml = '<input class="js-input">';
    const checkboxHtml = '<input class="js-checkbox" type="checkbox">';
    const radioHtml =
        '<input class="js-radio-1" type="radio" name="radio" value="1"><input class="js-radio-2" type="radio" name="radio" value="2">';
    const selectHtml =
        '<select class="js-select"><option class="js-select-option-1" value="1"></option><option class="js-select-option-2" value="2"></option></select>';
    const multiSelectHtml =
        '<select multiple class="js-mselect"><option class="js-mselect-option-1" value="1"></option><option class="js-mselect-option-2" value="2"></option></select>';
    const textareaHtml = '<textarea class="js-textarea"></textarea>';
    document.body.innerHTML = `${inputHtml}${checkboxHtml}${radioHtml}${selectHtml}${multiSelectHtml}${textareaHtml}`;
    input = document.querySelector('.js-input');
    checkbox = document.querySelector('.js-checkbox');
    textarea = document.querySelector('.js-textarea');
});

describe('test validateOnChange and validateOnType options', () => {
    test('validate is not called on change or type without validateOnChange and validateOnType', () => {
        const field = new Field('.js-input', ['required']);
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(input, { target: { value: 'some text' } });
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        jest.runAllTimers();

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('validate is not called on type with validateOnChange', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnChange: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        jest.runAllTimers();

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('validate is called on change with validateOnChange', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnChange: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(input, { target: { value: 'some text' } });

        expect(field.validate).toHaveBeenCalledTimes(1);
    });

    test('validate is called on change with validateOnType', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(input, { target: { value: 'some text' } });

        expect(field.validate).toHaveBeenCalledTimes(1);
    });

    test('validate is called on type with validateOnType', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();

        field.listen();

        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
        jest.runAllTimers();

        expect(field.validate).toHaveBeenCalledTimes(1);
    });

    test('validate is called twice on type with break with validateOnType', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();

        field.listen();

        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        jest.runAllTimers();
        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
        jest.runAllTimers();

        expect(field.validate).toHaveBeenCalledTimes(2);
    });

    test('validate is called twice on type and change with validateOnType and validateOnChange', () => {
        const field = new Field('.js-input', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();

        field.listen();

        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        jest.runAllTimers();
        fireEvent.change(input, { target: { value: 'some text' } });

        expect(field.validate).toHaveBeenCalledTimes(2);
    });
});

describe('test validate callback options', () => {
    test('onBeforeValidate is called', async () => {
        const onBeforeValidate = jest.fn();
        const field = new Field('.js-input', ['required'], {
            onBeforeValidate,
        });

        await field.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidate.mock.calls[0][1]).toBeNull();
    });

    test('onAfterValidate is called', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
        });

        await field.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterValidate.mock.calls[0][1]).toBe(input);
        expect(onAfterValidate.mock.calls[0][2]).toBeNull();
    });
});

describe('test callback options', () => {
    test('onTypingStart is called on key up', () => {
        const onTypingStart = jest.fn();
        const field = new Field('.js-input', [], {
            onTypingStart,
        });
        field.listen();
        input.value = 'some value';
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });

        expect(onTypingStart).toHaveBeenCalledTimes(1);
        expect(onTypingStart.mock.calls[0][0]).toBe('some value');
        expect(onTypingStart.mock.calls[0][1]).toBe(input);
        expect(onTypingStart.mock.calls[0][2]).toBeNull();
    });

    test('onTypingEnd is called  on key up', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', [], {
            onTypingEnd,
        });
        field.listen();
        input.value = 'some value';
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });

        expect(onTypingEnd).not.toHaveBeenCalled();

        jest.runAllTimers();

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][0]).toBe('some value');
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBeNull();
    });

    test('onTypingStart is not called and onTypingEnd is called on change', () => {
        const onTypingStart = jest.fn();
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', [], {
            onTypingStart,
            onTypingEnd,
        });
        field.listen();
        input.value = 'some value 1';
        fireEvent.change(input, { target: { value: 'some value 2' } });

        expect(onTypingStart).not.toHaveBeenCalled();
        expect(onTypingEnd.mock.calls[0][0]).toBe('some value 2');
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBeNull();
    });

    test('onChange is called on change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', [], {
            onChange,
        });
        field.listen();
        input.value = 'some value';
        fireEvent.change(input, { target: { value: 'some value 2' } });

        expect(onChange.mock.calls[0][0]).toBe('some value 2');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });
});

describe('test validation result', function () {
    test('validation result is true in onAfterValidate', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBe(true);
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
        });

        input.value = 'some value';

        await field.validate();
    });

    test('validation result is false in onAfterValidate', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBe(false);
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('field is valid', async () => {
        const field = new Field('.js-input', ['required']);

        input.value = 'some value';

        const isValid = await field.isValid();

        expect(isValid).toBe(true);
    });

    test('field is invalid', async () => {
        const field = new Field('.js-input', ['required']);

        const isValid = await field.isValid();

        expect(isValid).toBe(false);
    });

    test('isValid with validation result state', async () => {
        const field = new Field('.js-input', ['required']);
        let isValid;

        field.validationResult = new ValidationResult(true);
        isValid = await field.isValid();
        expect(isValid).toBe(true);

        field.validationResult = new ValidationResult(false);
        isValid = await field.isValid();
        expect(isValid).toBe(false);
    });

    test('forced isValid with validation result state', async () => {
        const field = new Field('.js-input', ['required']);
        let isValid;

        field.validationResult = new ValidationResult(true);
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        field.validationResult = new ValidationResult(false);
        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });
});

describe('test some validators', () => {
    test('no validators', async () => {
        let isValid;

        const field = new Field('.js-input');

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('isEmail', async () => {
        let isValid;

        const field = new Field('.js-input', ['isEmail']);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'example@example.com';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('required and isEmail', async () => {
        let isValid;

        const field = new Field('.js-input', ['required', 'isEmail']);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'example@example.com';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', [
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('promised custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', [
            (value) => {
                return new Promise((resolve) => {
                    resolve(new ValidationResult(value === '12345'));
                });
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('required and custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', [
            'required',
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'some value';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('validator params', async () => {
        let isValid;

        const field = new Field('.js-input', ['isCurrency'], {
            validatorParams: {
                isCurrency: [{ require_symbol: true }],
            },
        });

        input.value = '23';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '$23';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });
});

describe('test message options', () => {
    test('default valid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('');
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
        });

        input.value = 'some value';

        await field.validate();
    });

    test('valid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('Field is valid.');
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
            validMessage: 'Field is valid.',
        });

        input.value = 'some value';

        await field.validate();
    });

    test('default invalid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('Invalid value.');
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('invalid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('This field is required.');
        };

        const field = new Field('.js-input', ['required'], {
            onAfterValidate,
            invalidMessages: {
                required: 'This field is required.',
            },
        });

        await field.validate();
    });
});

describe('test init field', () => {
    test('nonexistent element', () => {
        expect(() => new Field('.js-foo')).toThrow(Error);
    });

    test('root element is document', () => {
        const field = new Field('.js-input');

        expect(field.rootElement).toBe(document);
    });

    test('nonexistent element in form', () => {
        expect(() => {
            document.body.innerHTML = '<form class="js-form"></form><input class="js-input">';
            const form = document.querySelector('.js-form');
            Field('.js-input', [], {
                formElement: form,
            });
        }).toThrow(Error);
    });

    test('root element is form', () => {
        document.body.innerHTML = '<form class="js-form"><input class="js-input"></form>';
        const form = document.querySelector('.js-form');
        const field = new Field('.js-input', [], {
            formElement: form,
        });

        expect(field.rootElement.tagName).toBe('FORM');
    });
});

describe('test getValue', () => {
    test('get input value', () => {
        const field = new Field('.js-input');
        input.value = ' some text ';
        expect(field.getValue()).toBe('some text');
    });

    test('get checkbox value', () => {
        const field = new Field('.js-checkbox');
        expect(field.getValue()).toBe(false);
        checkbox.checked = true;
        expect(field.getValue()).toBe(true);
    });

    test('get radio value', () => {
        const field = new Field('.js-radio-1');
        expect(field.getValue()).toBeNull();
        document.querySelector('.js-radio-2').checked = true;
        expect(field.getValue()).toBe('2');
    });

    test('get select value', () => {
        const field = new Field('.js-select');
        expect(field.getValue()).toBe('1');
        document.querySelector('.js-select-option-2').selected = true;
        expect(field.getValue()).toBe('2');
    });

    test('get multi select value', () => {
        const field = new Field('.js-mselect');
        expect(field.getValue()).toStrictEqual([]);
        document.querySelector('.js-mselect-option-1').selected = true;
        document.querySelector('.js-mselect-option-2').selected = true;
        expect(field.getValue()).toStrictEqual(['1', '2']);
    });

    test('get textarea value', () => {
        const field = new Field('.js-textarea');
        textarea.value = ' some text ';
        expect(field.getValue()).toBe('some text');
    });

    test('get not trimmed value', () => {
        const fieldInput = new Field('.js-input', [], {
            trimEnabled: false,
        });
        const fieldTextarea = new Field('.js-textarea', [], {
            trimEnabled: false,
        });

        input.value = ' some text ';
        textarea.value = ' some text ';
        expect(fieldInput.getValue()).toBe(' some text ');
        expect(fieldTextarea.getValue()).toBe(' some text ');
    });
});

describe('test special css classes', () => {
    test('validating special css class', async () => {
        expect.assertions(1);

        const field = new Field('.js-input', [
            (value) => {
                expect(input.classList.contains('f-field-validating')).toBe(true);
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '1234';

        await field.validate();
    });

    test('valid special css class', async () => {
        const field = new Field('.js-input', ['required']);
        input.value = '1234';
        await field.validate();
        expect(input.classList.contains('f-field-valid')).toBe(true);
    });

    test('invalid special css class', async () => {
        const field = new Field('.js-input', ['required']);
        await field.validate();
        expect(input.classList.contains('f-field-invalid')).toBe(true);
    });

    test('invalid special css class using container', async () => {
        document.body.innerHTML = `<div class="js-wrapped js-f-field-container">
                <input class="js-radio-1" type="radio" name="radio" value="1">
                <input class="js-radio-2" type="radio" name="radio" value="2">
            </div>`;
        const field = new Field('.js-radio-1', ['required']);
        const wrapped = document.querySelector('.js-wrapped');
        await field.validate();
        expect(wrapped.classList.contains('f-field-invalid')).toBe(true);
    });
});
