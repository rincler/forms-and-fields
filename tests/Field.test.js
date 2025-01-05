/**
 * @jest-environment jsdom
 */

import { fireEvent } from '@testing-library/dom';
import Field from '../src/Field';
import ValidationResult from '../src/ValidationResult';

let input = null;
jest.useFakeTimers();

beforeEach(() => {
    document.body.innerHTML = `
        <div class="js-container">
            <input class="js-input" />
            <input class="js-list-input js-list-input-1" name="list-input-name[0]" />
            <input class="js-list-input js-list-input-2" name="list-input-name[1]" />
            <input class="js-list-input js-list-input-3" name="list-input-name[2]" />
            <input class="js-checkbox" type="checkbox" />
            <input class="js-radio js-radio-1" type="radio" name="radio" value="1">
            <input class="js-radio js-radio-2" type="radio" name="radio" value="2" />
            <select class="js-select">
                <option class="js-select-option-1" value="1"></option>
                <option class="js-select-option-2" value="2"></option>
            </select>
            <select multiple class="js-multi-select">
                <option class="js-multi-select-option-1" value="1"></option>
                <option class="js-multi-select-option-2" value="2"></option>
            </select>
            <textarea class="js-textarea"></textarea>
        </div>
    `;

    input = document.querySelector('.js-input');
});

describe('"validateOnType" and "validateOnChange" options', () => {
    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 1],
        [true, true, 2],
    ])('Type and change. validateOnType=%s, validateOnChange=%s', (validateOnType, validateOnChange, times) => {
        const field = new Field('.js-input', '.js-container', ['required'], {
            validateOnType,
            validateOnChange,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
        jest.runAllTimers();
        fireEvent.change(input, { target: { value: 'bar' } });

        expect(field.validate).toHaveBeenCalledTimes(times);
    });

    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 3],
        [true, true, 4],
    ])('Type slowly and change. validateOnType=%s, validateOnChange=%s', (validateOnType, validateOnChange, times) => {
        const field = new Field('.js-input', '.js-container', ['required'], {
            validateOnType,
            validateOnChange,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        jest.runAllTimers();
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        jest.runAllTimers();
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
        jest.runAllTimers();
        fireEvent.change(input, { target: { value: 'bar' } });

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
            const field = new Field('.js-input', '.js-container', ['required'], {
                validateOnType,
                validateOnChange,
            });
            field.validate = jest.fn();
            field.listen();

            fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
            fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
            fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
            fireEvent.change(input, { target: { value: 'bar' } });
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
            const field = new Field('.js-input', '.js-container', ['required'], {
                validateOnType,
                validateOnChange,
            });
            field.validate = jest.fn();
            field.listen();

            fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
            jest.runAllTimers();
            fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
            jest.runAllTimers();
            fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
            fireEvent.change(input, { target: { value: 'bar' } });
            jest.runAllTimers();

            expect(field.validate).toHaveBeenCalledTimes(times);
        }
    );

    test('"validate" is not called on type when "validateOnChange" is true', () => {
        const field = new Field('.js-input', '.js-container', ['required'], {
            validateOnChange: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
        jest.runAllTimers();

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('"validate" is not called on change when "validateOnType" is true', () => {
        const field = new Field('.js-input', '.js-container', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(input, { target: { value: 'bar' } });

        expect(field.validate).not.toHaveBeenCalled();
    });
});

describe('validation callback options', () => {
    test('"onBeforeValidate" is called', async () => {
        const onBeforeValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', ['required'], {
            onBeforeValidate,
        });

        await field.validate();

        expect(onBeforeValidate).toHaveBeenCalledTimes(1);
        expect(onBeforeValidate.mock.calls[0][0]).toBe(input);
        expect(onBeforeValidate.mock.calls[0][1]).toBeNull();
    });

    test('"onAfterValidate" is called', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', ['required'], {
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
        const field = new Field('.js-input', '.js-container', [], {
            onTypingStart,
        });
        field.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });

        expect(onTypingStart).toHaveBeenCalledTimes(1);
        expect(onTypingStart.mock.calls[0][1]).toBe(input);
        expect(onTypingStart.mock.calls[0][2]).toBeNull();
    });

    test('"onTypingEnd" is called  on key up', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onTypingEnd,
        });
        field.listen();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });

        expect(onTypingEnd).not.toHaveBeenCalled();

        jest.runAllTimers();

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBeNull();
    });

    test('"onTypingEnd" is called on change', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
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

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onChange,
        });
        field.listen();
        input.value = 'foo';
        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });

    test('"onChange" is called on text input (which is added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-dynamic-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        document
            .querySelector('.js-container')
            .insertAdjacentHTML('beforeend', '<input class="js-dynamic-input" name="dynamic-input-name" />');

        const dynamicInput = document.querySelector('.js-dynamic-input');
        dynamicInput.value = 'foo';
        fireEvent.change(dynamicInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicInput);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });

    test('"onChange" is called on text input (which is one of the list) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-list-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        const listInput = document.querySelector('.js-list-input-3');
        listInput.value = 'foo';

        fireEvent.change(listInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(listInput);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });

    test('"onChange" is called on text input (which is one of the list and added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-list-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        document
            .querySelector('.js-container')
            .insertAdjacentHTML(
                'beforeend',
                `<input class="js-list-input js-dynamic-input-x" name="list-input-name[x]" />`
            );

        const dynamicListInput = document.querySelector('.js-dynamic-input-x');
        dynamicListInput.value = 'foo';

        fireEvent.change(dynamicListInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicListInput);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });

    test('"onChange" is called on radio input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-radio', '.js-container', [], {
            onChange,
        });
        field.listen();

        const radio = document.querySelector('.js-radio-2');

        fireEvent.click(radio);

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(radio);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });

    test('"onChange" is called on radio input (which is added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-dynamic-radio', '.js-container', [], {
            onChange,
        });
        field.listen();

        document.querySelector('.js-container').insertAdjacentHTML(
            'beforeend',
            `<input class="js-dynamic-radio js-dynamic-radio-1" type="radio" name="dynamic-radio-name" value="1" />
             <input class="js-dynamic-radio js-dynamic-radio-2" type="radio" name="dynamic-radio-name" value="2" />`
        );

        const dynamicRadio = document.querySelector('.js-dynamic-radio-2');

        fireEvent.click(dynamicRadio);

        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(dynamicRadio);
        expect(onChange.mock.calls[0][2]).toBeNull();
    });
});

describe('validation result', () => {
    test('validation result with true is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBeTruthy();
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        input.value = 'foo';

        await field.validate();
    });

    test('validation result with false is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.isValid()).toBeFalsy();
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('"isValid" is true', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        input.value = 'foo';

        const isValid = await field.isValid();

        expect(isValid).toBe(true);
    });

    test('"isValid" is false', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        const isValid = await field.isValid();

        expect(isValid).toBe(false);
    });

    test('"isValid" with state', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
        let isValid;

        field.validationResult = new ValidationResult(true);
        isValid = await field.isValid();
        expect(isValid).toBe(true);

        field.validationResult = new ValidationResult(false);
        isValid = await field.isValid();
        expect(isValid).toBe(false);
    });

    test('forced "isValid" with state', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
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

        const field = new Field('.js-input', '.js-container');

        input.value = '';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);

        input.value = 'foo';
        isValid = await field.isValid(true);
        expect(isValid).toBe(true);
    });

    test('"isEmail" validator', async () => {
        let isValid;

        const field = new Field('.js-input', '.js-container', ['isEmail']);

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

        const field = new Field('.js-input', '.js-container', ['required', 'isEmail']);

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

        const field = new Field('.js-input', '.js-container', [
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

    test('promised custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                return new Promise((resolve) => {
                    resolve(new ValidationResult(value === '12345'));
                });
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

    test('"required" and custom validator', async () => {
        let isValid;

        const field = new Field('.js-input', '.js-container', [
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

        const field = new Field('.js-input', '.js-container', ['isCurrency'], {
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

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        input.value = 'foo';

        await field.validate();
    });

    test('valid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('Field is valid.');
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
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

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('invalid message', async () => {
        const onAfterValidate = (validationResult) => {
            expect(validationResult.getMessage()).toBe('This field is required.');
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
            invalidMessages: {
                required: 'This field is required.',
            },
        });

        await field.validate();
    });
});

describe('init field', () => {
    test('non-existent root element', () => {
        expect(() => new Field('.js-input', '.js-foo')).toThrow(Error);
    });

    test('non-existent field element', () => {
        expect(() => new Field('.js-foo', '.js-container')).not.toThrow(Error);
    });
});

describe('"getValue"', () => {
    test('get input value', () => {
        const field = new Field('.js-input', '.js-container');
        input.value = ' foo ';
        expect(field.getValue()).toBe('foo');
    });

    test('get checkbox value', () => {
        const field = new Field('.js-checkbox', '.js-container');
        expect(field.getValue()).toBe(false);
        document.querySelector('.js-checkbox').checked = true;
        expect(field.getValue()).toBe(true);
    });

    test('get radio value', () => {
        const field = new Field('.js-radio', '.js-container');
        expect(field.getValue()).toBeNull();
        document.querySelector('.js-radio-2').checked = true;
        expect(field.getValue()).toBe('2');
    });

    test('get select value', () => {
        const field = new Field('.js-select', '.js-container');
        expect(field.getValue()).toBe('1');
        document.querySelector('.js-select-option-2').selected = true;
        expect(field.getValue()).toBe('2');
    });

    test('get multi select value', () => {
        const field = new Field('.js-multi-select', '.js-container');
        expect(field.getValue()).toStrictEqual([]);
        document.querySelector('.js-multi-select-option-1').selected = true;
        document.querySelector('.js-multi-select-option-2').selected = true;
        expect(field.getValue()).toStrictEqual(['1', '2']);
    });

    test('get textarea value', () => {
        const field = new Field('.js-textarea', '.js-container');
        document.querySelector('.js-textarea').value = ' foo ';
        expect(field.getValue()).toBe('foo');
    });

    test('get not trimmed value', () => {
        const fieldInput = new Field('.js-input', '.js-container', [], {
            trimEnabled: false,
        });
        const fieldTextarea = new Field('.js-textarea', '.js-container', [], {
            trimEnabled: false,
        });

        input.value = ' foo ';
        document.querySelector('.js-textarea').value = ' foo ';
        expect(fieldInput.getValue()).toBe(' foo ');
        expect(fieldTextarea.getValue()).toBe(' foo ');
    });
});

describe('special css classes', () => {
    test('"validating" special css class', async () => {
        expect.assertions(1);

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                expect(input.classList.contains('f-field-validating')).toBe(true);
                return new ValidationResult(value === 'bar');
            },
        ]);

        input.value = 'foo';

        await field.validate();
    });

    test('"valid" special css class', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
        input.value = 'foo';
        await field.validate();
        expect(input.classList.contains('f-field-valid')).toBe(true);
    });

    test('"invalid" special css class', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
        await field.validate();
        expect(input.classList.contains('f-field-invalid')).toBe(true);
    });

    test('"invalid" special css class using container', async () => {
        document.body.innerHTML = `
            <div class="js-wrapped js-f-field-container">
                <input class="js-radio" type="radio" name="radio" value="1" />
                <input class="js-radio" type="radio" name="radio" value="2" />
            </div>`;
        const field = new Field('.js-radio', '.js-f-field-container', ['required']);
        const wrapped = document.querySelector('.js-wrapped');
        await field.validate();
        expect(wrapped.classList.contains('f-field-invalid')).toBe(true);
    });
});
