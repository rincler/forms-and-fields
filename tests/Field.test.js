/**
 * @jest-environment jsdom
 */

import { fireEvent } from '@testing-library/dom';
import Field from '../src/Field';
import ValidationResult from '../src/ValidationResult';

let input = null;
let checkbox = null;
let textarea = null;
jest.useFakeTimers();

beforeEach(() => {
    document.body.innerHTML = `
        <input class="js-input" />
        <input class="js-checkbox" type="checkbox" />
        <input class="js-radio-1" type="radio" name="radio" value="1">
        <input class="js-radio-2" type="radio" name="radio" value="2" />
        <select class="js-select">
            <option class="js-select-option-1" value="1"></option>
            <option class="js-select-option-2" value="2"></option>
        </select>
        <select multiple class="js-multi-select">
            <option class="js-multi-select-option-1" value="1"></option>
            <option class="js-multi-select-option-2" value="2"></option>
        </select>
        <textarea class="js-textarea"></textarea>
    `;

    input = document.querySelector('.js-input');
    checkbox = document.querySelector('.js-checkbox');
    textarea = document.querySelector('.js-textarea');
});

describe('"validateOnType" and "validateOnChange" options', () => {
    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 1],
        [true, true, 2],
    ])('Type and change. validateOnType=%s, validateOnChange=%s', (validateOnType, validateOnChange, times) => {
        const field = new Field('.js-input', undefined, ['required'], {
            validateOnType,
            validateOnChange,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'R', code: 'KeyR' });
        jest.runAllTimers();
        fireEvent.change(input, { target: { value: 'BAR' } });

        expect(field.validate).toHaveBeenCalledTimes(times);
    });

    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 3],
        [true, true, 4],
    ])('Type slowly and change. validateOnType=%s, validateOnChange=%s', (validateOnType, validateOnChange, times) => {
        const field = new Field('.js-input', undefined, ['required'], {
            validateOnType,
            validateOnChange,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
        jest.runAllTimers();
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        jest.runAllTimers();
        fireEvent.keyUp(input, { key: 'R', code: 'KeyR' });
        jest.runAllTimers();
        fireEvent.change(input, { target: { value: 'BAR' } });

        expect(field.validate).toHaveBeenCalledTimes(times);
    });

    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 1],
        [true, true, 1],
    ])(
        'Type and change immediately. validateOnType=%s, validateOnChange=%s',
        (validateOnType, validateOnChange, times) => {
            const field = new Field('.js-input', undefined, ['required'], {
                validateOnType,
                validateOnChange,
            });
            field.validate = jest.fn();
            field.listen();

            fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
            fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
            fireEvent.keyUp(input, { key: 'R', code: 'KeyR' });
            fireEvent.change(input, { target: { value: 'BAR' } });
            jest.runAllTimers();

            expect(field.validate).toHaveBeenCalledTimes(times);
        }
    );

    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 3],
        [true, true, 3],
    ])(
        'Type slowly and change immediately. validateOnType=%s, validateOnChange=%s',
        (validateOnType, validateOnChange, times) => {
            const field = new Field('.js-input', undefined, ['required'], {
                validateOnType,
                validateOnChange,
            });
            field.validate = jest.fn();
            field.listen();

            fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });
            jest.runAllTimers();
            fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
            jest.runAllTimers();
            fireEvent.keyUp(input, { key: 'R', code: 'KeyR' });
            fireEvent.change(input, { target: { value: 'BAR' } });
            jest.runAllTimers();

            expect(field.validate).toHaveBeenCalledTimes(times);
        }
    );

    test('"validate" is not called on type when "validateOnChange" is true', () => {
        const field = new Field('.js-input', undefined, ['required'], {
            validateOnChange: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'E', code: 'KeyE' });
        jest.runAllTimers();

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('"validate" is not called on change when "validateOnType" is true', () => {
        const field = new Field('.js-input', undefined, ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(input, { target: { value: 'BAR' } });

        expect(field.validate).not.toHaveBeenCalled();
    });
});

describe('validation callback options', () => {
    test('"onBeforeValidate" is called', async () => {
        const onBeforeValidate = jest.fn();
        const field = new Field('.js-input', undefined, ['required'], {
            onBeforeValidate,
        });

        await field.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidate.mock.calls[0][1]).toBeNull();
    });

    test('"onAfterValidate" is called', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
        });

        await field.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toBeInstanceOf(ValidationResult);
        expect(onAfterValidate.mock.calls[0][1]).toBe(input);
        expect(onAfterValidate.mock.calls[0][2]).toBeNull();
    });
});

describe('callback options', () => {
    test('"onTypingStart" is called on key up', () => {
        const onTypingStart = jest.fn();
        const field = new Field('.js-input', undefined, [], {
            onTypingStart,
        });
        field.listen();
        input.value = 'foo';
        fireEvent.keyUp(input, { key: 'A', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'B', code: 'KeyB' });

        expect(onTypingStart).toHaveBeenCalledTimes(1);
        expect(onTypingStart.mock.calls[0][0]).toBe('foo');
        expect(onTypingStart.mock.calls[0][1]).toBe(input);
        expect(onTypingStart.mock.calls[0][2]).toBeNull();
    });

    test('"onTypingEnd" is called  on key up', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', undefined, [], {
            onTypingEnd,
        });
        field.listen();
        input.value = 'foo';
        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });

        expect(onTypingEnd).not.toHaveBeenCalled();

        jest.runAllTimers();

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][0]).toBe('foo');
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBeNull();
    });

    test('"onTypingEnd" is called on change', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', undefined, [], {
            onTypingEnd,
        });
        field.listen();
        input.value = 'Leo';
        fireEvent.keyUp(input, { key: 'n', code: 'KeyN' });
        fireEvent.change(input, { target: { value: 'Leon' } });

        expect(onTypingEnd).toHaveBeenCalled();
        expect(onTypingEnd.mock.calls[0][0]).toBe('Leon');
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBeNull();
    });

    test('onChange is called on change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', undefined, [], {
            onChange,
        });
        field.listen();
        input.value = 'foo';
        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });
});

describe('validation result', () => {
    test('validation result with true is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBeTruthy();
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
        });

        input.value = 'foo';

        await field.validate();
    });

    test('validation result with false is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBeFalsy();
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('"isValid" is true', async () => {
        const field = new Field('.js-input', undefined, ['required']);

        input.value = 'foo';

        const isValid = await field.isValid();

        expect(isValid).toBe(true);
    });

    test('"isValid" is false', async () => {
        const field = new Field('.js-input', undefined, ['required']);

        const isValid = await field.isValid();

        expect(isValid).toBe(false);
    });

    test('"isValid" with state', async () => {
        const field = new Field('.js-input', undefined, ['required']);
        let isValid;

        field.validationResult = new ValidationResult(true);
        isValid = await field.isValid();
        expect(isValid).toBe(true);

        field.validationResult = new ValidationResult(false);
        isValid = await field.isValid();
        expect(isValid).toBe(false);
    });

    test('forced "isValid" with state', async () => {
        const field = new Field('.js-input', undefined, ['required']);
        let isValid;

        field.validationResult = new ValidationResult(true);
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        field.validationResult = new ValidationResult(false);
        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });
});

describe('some validators', () => {
    test('no validators', async () => {
        let isValid;

        const field = new Field('.js-input');

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('"isEmail" validator', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, ['isEmail']);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'example@example.com';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('"required" and "isEmail"', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, ['required', 'isEmail']);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'example@example.com';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, [
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('promised custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, [
            (value) => {
                return new Promise((resolve) => {
                    resolve(new ValidationResult(value === '12345'));
                });
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('"required" and custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, [
            'required',
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(false);

        input.value = '12345';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('validator params', async () => {
        let isValid;

        const field = new Field('.js-input', undefined, ['isCurrency'], {
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

describe('message options', () => {
    test('default valid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('');
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
        });

        input.value = 'foo';

        await field.validate();
    });

    test('valid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('Field is valid.');
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
            validMessage: 'Field is valid.',
        });

        input.value = 'foo';

        await field.validate();
    });

    test('default invalid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('Invalid value.');
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('invalid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('This field is required.');
        };

        const field = new Field('.js-input', undefined, ['required'], {
            onAfterValidate,
            invalidMessages: {
                required: 'This field is required.',
            },
        });

        await field.validate();
    });
});

describe('test init field', () => {
    test('non-existent element', () => {
        expect(() => new Field('.js-foo')).toThrow(Error);
    });

    test('root element is document', () => {
        const field = new Field('.js-input');

        expect(field.rootElement).toBe(document);
    });

    test('non-existent element in form', () => {
        expect(() => {
            document.body.innerHTML = '<form class="js-form"></form><input class="js-input" />';
            // eslint-disable-next-line no-new
            new Field('.js-input', '.js-form', []);
        }).toThrow(Error);
    });

    test('root element is form', () => {
        document.body.innerHTML = '<form class="js-form"><input class="js-input" /></form>';
        const field = new Field('.js-input', '.js-form', []);

        expect(field.rootElement.tagName).toBe('FORM');
    });
});

describe('"getValue"', () => {
    test('get input value', () => {
        const field = new Field('.js-input');
        input.value = ' foo ';
        expect(field.getValue()).toBe('foo');
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
        const field = new Field('.js-multi-select');
        expect(field.getValue()).toStrictEqual([]);
        document.querySelector('.js-multi-select-option-1').selected = true;
        document.querySelector('.js-multi-select-option-2').selected = true;
        expect(field.getValue()).toStrictEqual(['1', '2']);
    });

    test('get textarea value', () => {
        const field = new Field('.js-textarea');
        textarea.value = ' foo ';
        expect(field.getValue()).toBe('foo');
    });

    test('get not trimmed value', () => {
        const fieldInput = new Field('.js-input', undefined, [], {
            trimEnabled: false,
        });
        const fieldTextarea = new Field('.js-textarea', undefined, [], {
            trimEnabled: false,
        });

        input.value = ' foo ';
        textarea.value = ' foo ';
        expect(fieldInput.getValue()).toBe(' foo ');
        expect(fieldTextarea.getValue()).toBe(' foo ');
    });
});

describe('special css classes', () => {
    test('validating special css class', async () => {
        expect.assertions(1);

        const field = new Field('.js-input', undefined, [
            (value) => {
                expect(input.classList.contains('f-field-validating')).toBe(true);
                return new ValidationResult(value === 'bar');
            },
        ]);

        input.value = 'foo';

        await field.validate();
    });

    test('valid special css class', async () => {
        const field = new Field('.js-input', undefined, ['required']);
        input.value = 'foo';
        await field.validate();
        expect(input.classList.contains('f-field-valid')).toBe(true);
    });

    test('invalid special css class', async () => {
        const field = new Field('.js-input', undefined, ['required']);
        await field.validate();
        expect(input.classList.contains('f-field-invalid')).toBe(true);
    });

    test('invalid special css class using container', async () => {
        document.body.innerHTML = `
            <div class="js-wrapped js-f-field-container">
                <input class="js-radio-1" type="radio" name="radio" value="1" />
                <input class="js-radio-2" type="radio" name="radio" value="2" />
            </div>`;
        const field = new Field('.js-radio-1', undefined, ['required']);
        const wrapped = document.querySelector('.js-wrapped');
        await field.validate();
        expect(wrapped.classList.contains('f-field-invalid')).toBe(true);
    });
});
