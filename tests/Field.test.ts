import { fireEvent, waitFor } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import Field from '../src/Field';
import ValidationResult from '../src/ValidationResult';
import FileValidator from '../src/validators/FileValidator';
import { FieldValue } from '../src';

// @ts-expect-error It will not be `null` after the `beforeEach`.
let containerElement: HTMLElement = null;
// @ts-expect-error It will not be `null` after the `beforeEach`.
let inputElement: HTMLInputElement = null;
const defaultInvalidValueMessage = 'Invalid value.';
jest.useFakeTimers();

const getInputElement = (selector: string): HTMLInputElement => {
    return document.querySelector<HTMLInputElement>(selector)!;
};

const getOptionElement = (selector: string): HTMLOptionElement => {
    return document.querySelector<HTMLOptionElement>(selector)!;
};

const getTextareaElement = (selector: string): HTMLTextAreaElement => {
    return document.querySelector<HTMLTextAreaElement>(selector)!;
};

const validateField = (field: Field) => {
    // eslint-disable-next-line no-param-reassign
    field.validationResult = null;
    return field.validate();
};

beforeEach(() => {
    document.body.innerHTML = `
        <div class="js-container">
            <input class="js-input" id="input" />
            <input class="js-group-input js-group-input-1" name="group-input-name" />
            <input class="js-group-input js-group-input-2" name="group-input-name" />
            <input class="js-group-input js-group-input-3" name="group-input-name" />
            <input class="js-checkbox" type="checkbox" />
            <div class="js-wrapper" data-field-wrapper>
                <input class="js-radio js-radio-1" type="radio" name="radio" value="1">
                <input class="js-radio js-radio-2" type="radio" name="radio" value="2" />
            </div>
            <select class="js-select">
                <option class="js-select-option-1" value="1"></option>
                <option class="js-select-option-2" value="2"></option>
            </select>
            <select multiple class="js-multiple-select">
                <option class="js-multiple-select-option-1" value="1"></option>
                <option class="js-multiple-select-option-2" value="2"></option>
            </select>
            <textarea class="js-textarea"></textarea>
            <input class="js-file" type="file" multiple />
        </div>
    `;

    containerElement = document.querySelector<HTMLElement>('.js-container')!;
    inputElement = getInputElement('.js-input');
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

            fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
            fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
            fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
            jest.runAllTimers();
            fireEvent.change(inputElement, { target: { value: 'bar' } });

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

            fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
            jest.runAllTimers();
            fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
            jest.runAllTimers();
            fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
            jest.runAllTimers();
            fireEvent.change(inputElement, { target: { value: 'bar' } });

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

            fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
            fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
            fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
            fireEvent.change(inputElement, { target: { value: 'bar' } });
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

            fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
            jest.runAllTimers();
            fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
            jest.runAllTimers();
            fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
            fireEvent.change(inputElement, { target: { value: 'bar' } });
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

        fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
        jest.runAllTimers();

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('"validate" is not called on change when "validateOnType" is true', () => {
        const field = new Field('.js-input', '.js-container', ['required'], {
            validateOnType: true,
        });
        field.validate = jest.fn();
        field.listen();

        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(field.validate).not.toHaveBeenCalled();
    });

    test('"validate" does not use validation result cache on typing', async () => {
        const field = new Field(
            '.js-input',
            '.js-container',
            [
                (value) => {
                    return ValidationResult.make(value === 'bar');
                },
            ],
            {
                validateOnType: true,
                validationCacheEnabled: true,
            },
        );
        field.listen();

        await field.validate();

        fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });
        inputElement.value = 'bar';
        jest.runAllTimers();

        await waitFor(() => {
            expect(field.validationResult!.isValid()).toBe(true);
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
        expect(onBeforeValidate.mock.calls[0][0]).toBe(inputElement);
        expect(onBeforeValidate.mock.calls[0][1]).toBe(containerElement);
    });

    test('"onAfterValidate" is called', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', ['isEmail'], {
            onAfterValidate,
        });

        await field.validate();

        expect(onAfterValidate).toHaveBeenCalledTimes(1);
        expect(onAfterValidate.mock.calls[0][0]).toStrictEqual(ValidationResult.valid());
        expect(onAfterValidate.mock.calls[0][1]).toBe(inputElement);
        expect(onAfterValidate.mock.calls[0][2]).toBe(containerElement);
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
        expect(onValidationError.mock.calls[0][1]).toBe(inputElement);
        expect(onValidationError.mock.calls[0][2]).toBe(containerElement);
    });
});

describe('callback options', () => {
    test('"onTypingStart" is called on key up', () => {
        const onTypingStart = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onTypingStart,
        });
        field.listen();

        fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });

        expect(onTypingStart).toHaveBeenCalledTimes(1);
        expect(onTypingStart.mock.calls[0][0]).toBe(inputElement);
        expect(onTypingStart.mock.calls[0][1]).toBe(containerElement);
    });

    test('"onTypingEnd" is called  on key up', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onTypingEnd,
        });
        field.listen();

        fireEvent.keyUp(inputElement, { key: 'b', code: 'KeyB' });
        fireEvent.keyUp(inputElement, { key: 'a', code: 'KeyA' });
        fireEvent.keyUp(inputElement, { key: 'r', code: 'KeyR' });

        expect(onTypingEnd).not.toHaveBeenCalled();

        jest.runAllTimers();

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][1]).toBe(inputElement);
        expect(onTypingEnd.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onTypingEnd" is called on change', () => {
        const onTypingEnd = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onTypingEnd,
        });
        field.listen();
        inputElement.value = 'Leo';
        fireEvent.keyUp(inputElement, { key: 'n', code: 'KeyN' });
        fireEvent.change(inputElement, { target: { value: 'Leon' } });

        expect(onTypingEnd).toHaveBeenCalledTimes(1);
        expect(onTypingEnd.mock.calls[0][0]).toBe('Leon');
        expect(onTypingEnd.mock.calls[0][1]).toBe(inputElement);
        expect(onTypingEnd.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on text input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onChange,
        });
        field.listen();
        inputElement.value = 'foo';
        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(inputElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on text input change, selector is not class', () => {
        const onChange = jest.fn();
        const field = new Field('#input', '.js-container', [], {
            onChange,
        });
        field.listen();
        inputElement.value = 'foo';
        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('"onChange" is called when trimming', async () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        inputElement.value = 'foo ';

        await field.validate();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('foo');
        expect(onChange.mock.calls[0][1]).toBe(inputElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on text input (which is added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-dynamic-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        document
            .querySelector('.js-container')!
            .insertAdjacentHTML(
                'beforeend',
                '<input class="js-dynamic-input" name="dynamic-input-name" />',
            );

        const dynamicInputElement = getInputElement('.js-dynamic-input');
        dynamicInputElement.value = 'foo';
        fireEvent.change(dynamicInputElement, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicInputElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on text input (which is one of the group) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-group-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        const groupInputElement = getInputElement('.js-group-input-3');
        groupInputElement.value = 'foo';

        fireEvent.change(groupInputElement, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(groupInputElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on text input (which is one of the group and added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-group-input', '.js-container', [], {
            onChange,
        });
        field.listen();

        document
            .querySelector('.js-container')!
            .insertAdjacentHTML(
                'beforeend',
                `<input class="js-group-input js-dynamic-input-x" name="group-input-name" />`,
            );

        const dynamicGroupInput = getInputElement('.js-dynamic-input-x');
        dynamicGroupInput.value = 'foo';

        fireEvent.change(dynamicGroupInput, { target: { value: 'bar' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('bar');
        expect(onChange.mock.calls[0][1]).toBe(dynamicGroupInput);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on radio input change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-radio', '.js-container', [], {
            onChange,
        });
        field.listen();

        const radioElement = getInputElement('.js-radio-2');

        fireEvent.click(radioElement);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(radioElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is called on radio input (which is added programmatically) change', () => {
        const onChange = jest.fn();
        const field = new Field('.js-dynamic-radio', '.js-container', [], {
            onChange,
        });
        field.listen();

        document.querySelector('.js-container')!.insertAdjacentHTML(
            'beforeend',
            `<input class="js-dynamic-radio js-dynamic-radio-1" type="radio" name="dynamic-radio-name" value="1" />
             <input class="js-dynamic-radio js-dynamic-radio-2" type="radio" name="dynamic-radio-name" value="2" />`,
        );

        const dynamicRadioElement = getInputElement('.js-dynamic-radio-2');

        fireEvent.click(dynamicRadioElement);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('2');
        expect(onChange.mock.calls[0][1]).toBe(dynamicRadioElement);
        expect(onChange.mock.calls[0][2]).toBe(containerElement);
    });

    test('"onChange" is not called after stopping listening', () => {
        const onChange = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onChange,
        });
        const stopListening = field.listen();
        stopListening();

        fireEvent.change(inputElement, { target: { value: 'bar' } });

        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('message options', () => {
    test('default invalid message', async () => {
        const onAfterValidate = (validationResult: ValidationResult) => {
            expect(validationResult.getMessage()).toBe(defaultInvalidValueMessage);
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('invalid message', async () => {
        const onAfterValidate = (validationResult: ValidationResult) => {
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
        const field1 = new Field('.js-group-input-1', '.js-container');
        const field2 = new Field(
            '.js-group-input-2',
            '.js-container',
            [
                (value) => {
                    return ValidationResult.make(value === inputElement.value);
                },
            ],
            {
                validationCacheEnabled,
            },
        );
        field1.listen();
        field2.listen();

        inputElement.value = 'foo';

        let validationResult = await field2.validate();

        expect(validationResult.isValid()).toBe(false);

        fireEvent.change(inputElement, { target: { value: '' } });

        validationResult = await field2.validate();

        expect(validationResult.isValid()).toBe(expectedIsValid);
    });
});

describe('validation result', () => {
    test('validation result with true is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult: ValidationResult) => {
            expect(validationResult.isValid()).toBe(true);
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        inputElement.value = 'foo';

        await field.validate();
    });

    test('validation result with false is passed to "onAfterValidate"', async () => {
        const onAfterValidate = (validationResult: ValidationResult) => {
            expect(validationResult.isValid()).toBe(false);
        };

        const field = new Field('.js-input', '.js-container', ['required'], {
            onAfterValidate,
        });

        await field.validate();
    });

    test('"validate" is positive', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        inputElement.value = 'foo';

        const validationResult = await field.validate();

        expect(validationResult).toStrictEqual(ValidationResult.valid());
    });

    test('"validate" is negative', async () => {
        const field = new Field('.js-input', '.js-container', ['required']);

        const validationResult = await field.validate();

        expect(validationResult).toStrictEqual(
            ValidationResult.invalid(defaultInvalidValueMessage),
        );
    });
});

describe('some validators', () => {
    test('no validators', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container');

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('"isEmail" validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['isEmail']);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'example@example.com';
        validationResult = await validateField(field);

        expect(validationResult.isValid()).toBe(true);
    });

    test('"required" and "isEmail"', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['required', 'isEmail']);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'example@example.com';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                return ValidationResult.make(value === '12345');
            },
        ]);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = '12345';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('custom object validator', async () => {
        let validationResult;

        const validator = {
            validate: (value: FieldValue) => {
                return ValidationResult.make(value === '12345');
            },
        };

        const field = new Field('.js-input', '.js-container', [validator]);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = '12345';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('promised custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            (value) => {
                return Promise.resolve(ValidationResult.make(value === '12345'));
            },
        ]);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = '12345';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('"required" and custom validator', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', [
            'required',
            (value) => {
                return ValidationResult.make(value === '12345');
            },
        ]);

        inputElement.value = '';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = 'foo';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = '12345';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('validator params', async () => {
        let validationResult;

        const field = new Field('.js-input', '.js-container', ['isCurrency'], {
            validatorParams: {
                isCurrency: [{ require_symbol: true }],
            },
        });

        inputElement.value = '23';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(false);

        inputElement.value = '$23';
        validationResult = await validateField(field);
        expect(validationResult.isValid()).toBe(true);
    });

    test('trim before validation', async () => {
        const fieldInput = new Field('.js-input', '.js-container', [], {
            trimEnabled: true,
        });
        const fieldTextarea = new Field('.js-textarea', '.js-container', [], {
            trimEnabled: true,
        });

        inputElement.value = ' foo ';
        getTextareaElement('.js-textarea').value = 'bar\n\n';

        await fieldInput.validate();
        await fieldTextarea.validate();

        expect(fieldInput.getValue()).toBe('foo');
        expect(fieldTextarea.getValue()).toBe('bar');
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

        const fileInput = getInputElement('.js-file');

        userEvent.upload(fileInput, new File([], 'example.jpg', { type: 'image/jpg' }));

        await waitFor(async () => {
            expect(fileInput.files).toHaveLength(1);
            const validationResult = await field.validate();
            expect(validationResult.isValid()).toBe(true);
        });
    });

    test('valid when no file', async () => {
        const field = new Field('.js-file', '.js-container', [newFileValidator()]);

        const validationResult = await field.validate();
        expect(validationResult.isValid()).toBe(true);
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

        const fileInput = getInputElement('.js-file');

        userEvent.upload(fileInput, files);

        await waitFor(async () => {
            expect(fileInput.files).toHaveLength(files.length);
            const validationResult = await field.validate();
            expect(validationResult).toStrictEqual(ValidationResult.invalid(expectedErrorMessage));
        });
    });
});

describe('init field', () => {
    test('non-existent container element', () => {
        expect(() => new Field('.js-input', '.js-foo')).toThrow(Error);
    });

    test('non-existent field element', () => {
        expect(() => new Field('.js-foo', '.js-container')).not.toThrow(Error);
    });
});

describe('"getValue"', () => {
    test('get input value', () => {
        const field = new Field('.js-input', '.js-container');
        inputElement.value = 'foo';
        expect(field.getValue()).toBe('foo');
    });

    test('get checkbox value', () => {
        const field = new Field('.js-checkbox', '.js-container');
        expect(field.getValue()).toBe(false);
        getInputElement('.js-checkbox').checked = true;
        expect(field.getValue()).toBe(true);
    });

    test('get radio value', () => {
        const field = new Field('.js-radio', '.js-container');
        expect(field.getValue()).toBeNull();
        getInputElement('.js-radio-2').checked = true;
        expect(field.getValue()).toBe('2');
    });

    test('get select value', () => {
        const field = new Field('.js-select', '.js-container');
        expect(field.getValue()).toBe('1');
        getOptionElement('.js-select-option-2').selected = true;
        expect(field.getValue()).toBe('2');
    });

    test('get multi select value', () => {
        const field = new Field('.js-multiple-select', '.js-container');
        expect(field.getValue()).toStrictEqual([]);
        getOptionElement('.js-multiple-select-option-1').selected = true;
        getOptionElement('.js-multiple-select-option-2').selected = true;
        expect(field.getValue()).toStrictEqual(['1', '2']);
    });

    test('get file value', () => {
        const field = new Field('.js-file', '.js-container');
        expect(field.getValue()).toBeInstanceOf(FileList);
        expect((field.getValue() as FileList).length).toBe(0);

        const expectedFile = new File([], 'example.jpg', { type: 'image/jpg' });
        fireEvent.change(getInputElement('.js-file'), {
            target: {
                files: [expectedFile],
            },
        });

        expect((field.getValue() as FileList).length).toBe(1);
        const file = (field.getValue() as FileList)[0];
        expect(file).toBe(expectedFile);
    });

    test('get textarea value', () => {
        const field = new Field('.js-textarea', '.js-container');
        getTextareaElement('.js-textarea').value = 'foo';
        expect(field.getValue()).toBe('foo');
    });
});

describe('statuses', () => {
    test('validating', async () => {
        const onStatusChange = jest.fn();
        const field = new Field(
            '.js-input',
            '.js-container',
            [
                () => {
                    expect(inputElement.classList.contains('ff-field-validating')).toBe(true);
                    expect(onStatusChange).toHaveBeenCalledTimes(1);
                    expect(onStatusChange.mock.calls[0][0]).toBe('ff-field-validating');
                    expect(onStatusChange.mock.calls[0][1]).toBeNull();
                    expect(onStatusChange.mock.calls[0][2]).toBe(inputElement);
                    expect(onStatusChange.mock.calls[0][3]).toBe(containerElement);
                    expect(onStatusChange.mock.calls[0][4]).toBeNull();
                    return ValidationResult.valid();
                },
            ],
            {
                onStatusChange,
            },
        );

        await field.validate();
    });

    test('valid', async () => {
        const onStatusChange = jest.fn();
        const field = new Field('.js-input', '.js-container', ['required'], {
            onStatusChange,
        });

        inputElement.value = 'foo';

        await field.validate();

        expect(inputElement.classList.contains('ff-field-valid')).toBe(true);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-field-valid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual(ValidationResult.valid());
        expect(onStatusChange.mock.calls[1][2]).toBe(inputElement);
        expect(onStatusChange.mock.calls[1][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[1][4]).toBeNull();
    });

    test('invalid', async () => {
        const onStatusChange = jest.fn();
        const field = new Field('.js-input', '.js-container', ['required'], {
            onStatusChange,
        });

        await field.validate();

        expect(inputElement.classList.contains('ff-field-invalid')).toBe(true);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-field-invalid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual(
            ValidationResult.invalid(defaultInvalidValueMessage),
        );
        expect(onStatusChange.mock.calls[1][2]).toBe(inputElement);
        expect(onStatusChange.mock.calls[1][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[1][4]).toBeNull();
    });

    test('with wrapper', async () => {
        const onStatusChange = jest.fn();
        const field = new Field('.js-radio', '.js-container', [], {
            onStatusChange,
        });

        const wrapperElement = document.querySelector('.js-wrapper');

        await field.validate();

        expect(wrapperElement!.classList.contains('ff-field-valid')).toBe(true);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-field-valid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual(ValidationResult.valid());
        expect(onStatusChange.mock.calls[1][2]).toBe(getInputElement('.js-radio'));
        expect(onStatusChange.mock.calls[1][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[1][4]).toBe(wrapperElement);
    });

    test('status is not reset on change input', () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onStatusChange,
            onStatusReset,
        });
        field.validationResult = ValidationResult.valid();
        field.listen();

        inputElement.classList.add('ff-field-valid', 'ff-field-invalid');

        fireEvent.change(inputElement);

        expect(field.validationResult).toStrictEqual(ValidationResult.valid());
        expect(inputElement.classList.contains('ff-field-valid')).toBe(true);
        expect(inputElement.classList.contains('ff-field-invalid')).toBe(true);
        expect(onStatusChange).not.toHaveBeenCalled();
        expect(onStatusReset).not.toHaveBeenCalled();
    });

    test('status is reset on change radio', () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const field = new Field('.js-radio', '.js-container', [], {
            onStatusChange,
            onStatusReset,
        });
        field.validationResult = ValidationResult.valid();
        field.listen();

        const radioElement = getInputElement('.js-radio');
        const wrapperElement = document.querySelector('.js-wrapper') as HTMLElement;
        wrapperElement.classList.add('ff-field-valid', 'ff-field-invalid');

        fireEvent.change(getInputElement('.js-radio'));

        expect(field.validationResult).toBeNull();
        expect(wrapperElement.classList.contains('ff-field-valid')).toBe(false);
        expect(wrapperElement.classList.contains('ff-field-invalid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(1);
        expect(onStatusChange.mock.calls[0][0]).toBe('');
        expect(onStatusChange.mock.calls[0][1]).toStrictEqual(null);
        expect(onStatusChange.mock.calls[0][2]).toBe(radioElement);
        expect(onStatusChange.mock.calls[0][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[0][4]).toBe(wrapperElement);
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(radioElement);
        expect(onStatusReset.mock.calls[0][1]).toBe(containerElement);
        expect(onStatusReset.mock.calls[0][2]).toBe(wrapperElement);
    });

    test('status is reset on type', () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
        const field = new Field('.js-input', '.js-container', [], {
            onStatusChange,
            onStatusReset,
        });
        field.validationResult = ValidationResult.valid();
        field.listen();

        inputElement.classList.add('ff-field-valid', 'ff-field-invalid');

        fireEvent.keyUp(inputElement);

        expect(field.validationResult).toBeNull();
        expect(inputElement.classList.contains('ff-field-valid')).toBe(false);
        expect(inputElement.classList.contains('ff-field-invalid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(1);
        expect(onStatusChange.mock.calls[0][0]).toBe('');
        expect(onStatusChange.mock.calls[0][1]).toStrictEqual(null);
        expect(onStatusChange.mock.calls[0][2]).toBe(inputElement);
        expect(onStatusChange.mock.calls[0][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[0][4]).toBeNull();
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(inputElement);
        expect(onStatusReset.mock.calls[0][1]).toBe(containerElement);
        expect(onStatusReset.mock.calls[0][2]).toBeNull();
    });

    test('status is reset on validation error', async () => {
        const onStatusChange = jest.fn();
        const onStatusReset = jest.fn();
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
                onStatusChange,
                onStatusReset,
            },
        );

        await field.validate().catch(() => {});

        expect(inputElement.classList.contains('ff-field-valid')).toBe(false);
        expect(inputElement.classList.contains('ff-field-invalid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('');
        expect(onStatusChange.mock.calls[1][1]).toBeNull();
        expect(onStatusChange.mock.calls[1][2]).toBe(inputElement);
        expect(onStatusChange.mock.calls[1][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[1][4]).toBeNull();
        expect(onStatusReset).toHaveBeenCalledTimes(1);
        expect(onStatusReset.mock.calls[0][0]).toBe(inputElement);
        expect(onStatusReset.mock.calls[0][1]).toBe(containerElement);
        expect(onStatusReset.mock.calls[0][2]).toBeNull();
    });

    test('valid, CSS status disabled', async () => {
        const onStatusChange = jest.fn();
        const field = new Field('.js-input', '.js-container', ['required'], {
            onStatusChange,
            cssStatusEnabled: false,
        });

        inputElement.value = 'foo';

        await field.validate();

        expect(inputElement.classList.contains('ff-field-valid')).toBe(false);
        expect(onStatusChange).toHaveBeenCalledTimes(2);
        expect(onStatusChange.mock.calls[1][0]).toBe('ff-field-valid');
        expect(onStatusChange.mock.calls[1][1]).toStrictEqual(ValidationResult.valid());
        expect(onStatusChange.mock.calls[1][2]).toBe(inputElement);
        expect(onStatusChange.mock.calls[1][3]).toBe(containerElement);
        expect(onStatusChange.mock.calls[1][4]).toBeNull();
    });
});

describe('rejection', () => {
    test('reject validation when new validation starts', async () => {
        const onAfterValidate = jest.fn();
        const field = new Field('.js-input', '.js-container', [() => ValidationResult.valid()], {
            onAfterValidate,
        });

        field.validate().catch(() => {});
        field.validate().catch(() => {});
        field.validate();

        await waitFor(() => {
            expect(onAfterValidate).toHaveBeenCalledTimes(1);
        });
    });
});
