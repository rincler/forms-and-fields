/**
 * @jest-environment jsdom
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import Field from '../src/Field';
import ValidationResult from '../src/ValidationResult';
import FileValidator from '../src/validators/FileValidator';

let input = null;
let container = null;
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
            <input class="js-file" type="file" />
        </div>
    `;

    input = document.querySelector('.js-input');
    container = document.querySelector('.js-container');
});

describe('"validateOnType" and "validateOnChange" options', () => {
    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 1],
        [true, true, 2],
    ])(
        'Type and change. validateOnType=%s, validateOnChange=%s',
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
            jest.runAllTimers();
            fireEvent.change(input, { target: { value: 'bar' } });

            expect(field.validate).toHaveBeenCalledTimes(times);
        },
    );

    test.each([
        [false, false, 0],
        [false, true, 1],
        [true, false, 3],
        [true, true, 4],
    ])(
        'Type slowly and change. validateOnType=%s, validateOnChange=%s',
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
            jest.runAllTimers();
            fireEvent.change(input, { target: { value: 'bar' } });

            expect(field.validate).toHaveBeenCalledTimes(times);
        },
    );

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
        },
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
        },
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

    test('"validate" does not use validation result cache on typing', async () => {
        const field = new Field(
            '.js-input',
            '.js-container',
            [
                (value) => {
                    return new ValidationResult(value === 'bar');
                },
            ],
            {
                validateOnType: true,
                validationCacheEnabled: true,
            },
        );
        field.listen();

        await field.validate();

        fireEvent.keyUp(input, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(input, { key: 'r', code: 'KeyR' });
        input.value = 'bar';
        jest.runAllTimers();

        await waitFor(() => {
            expect(field.validationResult.isValid()).toBeTruthy();
        });
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
        expect(onBeforeValidate.mock.calls[0][1]).toBe(container);
    });

    test('"onBeforeValidate" is not called because of no validators', async () => {
        const onBeforeValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onBeforeValidate,
        });

        await field.validate();

        expect(onBeforeValidate).not.toHaveBeenCalled();
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
        expect(onAfterValidate.mock.calls[0][2]).toBe(container);
    });

    test('"onAfterValidate" is not called because of no validators', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onAfterValidate,
        });

        await field.validate();

        expect(onAfterValidate).not.toHaveBeenCalled();
    });

    test('"onValidationError" is called', async () => {
        const onValidationError = jest.fn();
        const error = new Error('foo');
        const field = new Field(
            '.js-input',
            '.js-container',
            [
                () => {
                    throw error;
                },
            ],
            {
                onValidationError,
            },
        );

        await expect(field.validate()).rejects.toThrow(error);
        expect(onValidationError).toHaveBeenCalledTimes(1);
        expect(onValidationError.mock.calls[0][0]).toBe(error);
        expect(onValidationError.mock.calls[0][1]).toBe(input);
        expect(onValidationError.mock.calls[0][2]).toBe(container);
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
        expect(onTypingStart.mock.calls[0][2]).toBe(container);
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
        expect(onTypingEnd.mock.calls[0][2]).toBe(container);
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

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][0]).toBe('Leon');
        expect(onTypingEnd.mock.calls[0][1]).toBe(input);
        expect(onTypingEnd.mock.calls[0][2]).toBe(container);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onChange,
        });
        field.listen();
        input.value = 'foo';
        fireEvent.change(input, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(input);
        expect(onChange.mock.calls[0][2]).toBe(container);
    });

    test('"onChange" is called on text input (which is added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-dynamic-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        document
            .querySelector('.js-container')
            .insertAdjacentHTML(
                'beforeend',
                '<input class="js-dynamic-input" name="dynamic-input-name" />',
            );

        const dynamicInput = document.querySelector('.js-dynamic-input');
        dynamicInput.value = 'foo';
        fireEvent.change(dynamicInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicInput);
        expect(onChange.mock.calls[0][2]).toBe(container);
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

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(listInput);
        expect(onChange.mock.calls[0][2]).toBe(container);
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
                `<input class="js-list-input js-dynamic-input-x" name="list-input-name[x]" />`,
            );

        const dynamicListInput = document.querySelector('.js-dynamic-input-x');
        dynamicListInput.value = 'foo';

        fireEvent.change(dynamicListInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicListInput);
        expect(onChange.mock.calls[0][2]).toBe(container);
    });

    test('"onChange" is called on radio input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-radio', '.js-container', [], {
            onChange,
        });
        field.listen();

        const radio = document.querySelector('.js-radio-2');

        fireEvent.click(radio);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(radio);
        expect(onChange.mock.calls[0][2]).toBe(container);
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
             <input class="js-dynamic-radio js-dynamic-radio-2" type="radio" name="dynamic-radio-name" value="2" />`,
        );

        const dynamicRadio = document.querySelector('.js-dynamic-radio-2');

        fireEvent.click(dynamicRadio);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(dynamicRadio);
        expect(onChange.mock.calls[0][2]).toBe(container);
    });
});

describe('message options', () => {
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

describe('other options', () => {
    test.each([
        [true, false],
        [false, true],
    ])('"validationCacheEnabled" is %s', async (validationCacheEnabled, expectedIsValid) => {
        const field1 = new Field('.js-list-input-1', '.js-container', ['']);
        const field2 = new Field(
            '.js-list-input-2',
            '.js-container',
            [
                (value) => {
                    return new ValidationResult(value === input.value);
                },
            ],
            {
                validationCacheEnabled,
            },
        );
        field1.listen();
        field2.listen();

        input.value = 'foo';

        let validationResult = await field2.validate();

        expect(validationResult.isValid()).toBeFalsy();

        fireEvent.change(input, { target: { value: '' } });

        validationResult = await field2.validate();

        expect(validationResult.isValid()).toBe(expectedIsValid);
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

    test('"validate" positive', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        input.value = 'foo';

        const validationResult = await field.validate();

        expect(validationResult).toStrictEqual(new ValidationResult(true));
    });

    test('"validate" negative', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        const validationResult = await field.validate();

        expect(validationResult).toStrictEqual(new ValidationResult(false, 'Invalid value.'));
    });
});

describe('some validators', () => {
    test('no validators', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', []);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('"isEmail" validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['isEmail']);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'example@example.com';
        validationResult = await field.validate(true);

        expect(validationResult.isValid()).toBe(true);
    });

    test('"required" and "isEmail"', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['required', 'isEmail']);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'example@example.com';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = '12345';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('custom object validator', async () => {
        let validationResult;

        const validator = {
            validate: (value) => {
                return new ValidationResult(value === '12345');
            },
        };

        const field = new Field('.js-input', '.js-container', [validator]);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = '12345';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('promised custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                return new Promise((resolve) => {
                    resolve(new ValidationResult(value === '12345'));
                });
            },
        ]);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = '12345';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('"required" and custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            'required',
            (value) => {
                return new ValidationResult(value === '12345');
            },
        ]);

        input.value = '';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = 'foo';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = '12345';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });

    test('validator params', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['isCurrency'], {
            validatorParams: {
                isCurrency: [{ require_symbol: true }],
            },
        });

        input.value = '23';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(false);

        input.value = '$23';
        validationResult = await field.validate(true);
        expect(validationResult.isValid()).toBe(true);
    });
});

describe('file validator', () => {
    const newFileValidator = (invalidMessages = {}) => {
        return new FileValidator(
            {
                maxCount: 2,
                allowedMimeTypes: ['image/png', 'image/jpg'],
                allowedExtensions: ['.png', '.jpg'],
                maxSize: 3,
            },
            invalidMessages,
        );
    };

    test('valid file', async () => {
        const field = new Field('.js-file', '.js-container', [newFileValidator()]);

        fireEvent.change(document.querySelector('.js-file'), {
            target: {
                files: [new File([], 'example.jpg', { type: 'image/jpg' })],
            },
        });

        const validationResult = await field.validate();
        expect(validationResult.isValid()).toBeTruthy();
    });

    test('valid when no file', async () => {
        const field = new Field('.js-file', '.js-container', [newFileValidator()]);

        const validationResult = await field.validate();
        expect(validationResult.isValid()).toBeTruthy();
    });

    test.each([
        [
            'MIME type, default error message',
            [new File([], 'example.jpg', { type: 'text/plain' })],
            { allowedMimeTypes: undefined },
            'example.jpg is invalid.',
        ],
        [
            'MIME type, custom error message',
            [new File([], 'example.jpg', { type: 'text/plain' })],
            { allowedMimeTypes: '{file} has invalid MIME type.' },
            'example.jpg has invalid MIME type.',
        ],
        [
            'extension, default error message',
            [new File([], 'example.exe', { type: 'image/jpg' })],
            { allowedExtensions: undefined },
            'example.exe is invalid.',
        ],
        [
            'extension, custom error message',
            [new File([], 'example.exe', { type: 'image/jpg' })],
            { allowedExtensions: '{file} has invalid extension.' },
            'example.exe has invalid extension.',
        ],
        [
            'size, default error message',
            [new File(['content'], 'example.jpg', { type: 'image/jpg' })],
            { maxSize: undefined },
            'example.jpg is invalid.',
        ],
        [
            'size, custom error message',
            [new File(['content'], 'example.jpg', { type: 'image/jpg' })],
            { maxSize: '{file} must be less than {maxSize} bytes.' },
            'example.jpg must be less than 3 bytes.',
        ],
        [
            'count, default error message',
            [
                new File([], 'example1.jpg', { type: 'image/jpg' }),
                new File([], 'example2.jpg', { type: 'image/jpg' }),
                new File([], 'example3.jpg', { type: 'image/jpg' }),
            ],
            { maxCount: undefined },
            'Invalid count.',
        ],
        [
            'count, custom error message',
            [
                new File([], 'example1.jpg', { type: 'image/jpg' }),
                new File([], 'example2.jpg', { type: 'image/jpg' }),
                new File([], 'example3.jpg', { type: 'image/jpg' }),
            ],
            { maxCount: 'Max count of files is {maxCount}.' },
            'Max count of files is 2.',
        ],
    ])('invalid %s', async (_, files, invalidMessages, expectedErrorMessage) => {
        const field = new Field('.js-file', '.js-container', [newFileValidator(invalidMessages)]);

        fireEvent.change(document.querySelector('.js-file'), {
            target: {
                files,
            },
        });

        const validationResult = await field.validate();
        expect(validationResult).toStrictEqual(new ValidationResult(false, expectedErrorMessage));
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

    test('get file value', () => {
        const field = new Field('.js-file', '.js-container');
        expect(field.getValue()).toBeInstanceOf(FileList);
        expect(field.getValue().length).toBe(0);

        const expectedFile = new File([], 'example.jpg', { type: 'image/jpg' });
        fireEvent.change(document.querySelector('.js-file'), {
            target: {
                files: [expectedFile],
            },
        });

        expect(field.getValue().length).toBe(1);
        const file = field.getValue()[0];
        expect(file).toBe(expectedFile);
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

describe('special CSS classes', () => {
    test('validating', async () => {
        const field = new Field('.js-input', '.js-container', [
            (value) => {
                expect(input.classList.contains('ff-field-validating')).toBe(true);
                return new ValidationResult(value === 'bar');
            },
        ]);

        input.value = 'foo';

        await field.validate();
    });

    test('valid', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
        input.value = 'foo';
        await field.validate();
        expect(input.classList.contains('ff-field-valid')).toBe(true);
    });

    test('invalid', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);
        await field.validate();
        expect(input.classList.contains('ff-field-invalid')).toBe(true);
    });

    test('using container', async () => {
        document.body.innerHTML = `
            <div class="js-wrapped js-ff-field-container">
                <input class="js-radio" type="radio" name="radio" value="1" />
                <input class="js-radio" type="radio" name="radio" value="2" />
            </div>`;
        const field = new Field('.js-radio', '.js-ff-field-container', ['required']);
        const wrapped = document.querySelector('.js-wrapped');
        await field.validate();
        expect(wrapped.classList.contains('ff-field-invalid')).toBe(true);
    });

    test('no special CSS classes when error', async () => {
        const field = new Field('.js-input', '.js-container', [
            () => {
                throw new Error('foo');
            },
        ]);

        await field.validate().catch(() => {});

        expect(input.classList.contains('ff-field-invalid')).toBe(false);
        expect(input.classList.contains('ff-field-valid')).toBe(false);
    });
});
