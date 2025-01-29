# Forms and Fields

![NPM Version](https://img.shields.io/npm/v/forms-and-fields)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/rincler/forms-and-fields/ci.yml?branch=master)

A library for validating fields and submitting forms.

Field elements are elements like input (of any type), select, and textarea.

For validation, you can use the `required` validator, 
any validator from the [validator](https://www.npmjs.com/package/validator) library (e.g. `isEmail`), 
the `FileValidator` or your own custom validators (including AJAX-based validation).

## Usage

**HTML:**
```HTML
<form class="js-form">
    <div>
        <input type="text" name="email" class="js-email"/>
    </div>
    <button type="submit">Submit</button>
</form>
```

**JS:**
```JS
import Form from 'forms-and-fields';
import Field from 'forms-and-fields';
import SubmissionResult from 'forms-and-fields';

const form = new Form(
    '.js-form',
    [
        new Field('.js-email', '.js-form', ['required', 'isEmail'], {
            invalidMessages: {
                required: 'Email is required',
                isEmail: 'Invalid email'
            }
        })
    ], 
    (formData) => {
        console.log(formData);
        // here can be an AJAX-request
        return new SubmissionResult(true);
    }, 
    {
        onAfterValidateField: (validationResult) => {
            console.log(validationResult);
    },
});

form.listen();
```

**Console output:**

When you submit the form with an empty email:
```
ValidationResult {result: false, message: "Email is required"}
```

When you submit the form with an invalid email:
```
ValidationResult {result: false, message: "Invalid email"}
```

When you submit the form with a valid email:
```
ValidationResult {result: true, message: ""}
FormData { ... }
```

**More examples:**

Find more examples in the [sandbox](./sandbox).

## Installation

    npm install forms-and-fields

The library can be loaded either as a standalone script with the `FF` global name:

```HTML
<div class="js-email-container">
    <input type="text" name="email" class="js-email"/> 
</div>

<script type="text/javascript" src="https://unpkg.com/browse/forms-and-fields@latest/dist/forms-and-fields.min.js"></script>
<script type="text/javascript">
  const field = new FF.Field('.js-email', '.js-email-container', ['required', 'isEmail']);
  field.listen();
</script>
```

## Documentation

### Common

To validate and submit a form you need to create a `Form` object with required `Field` objects (associated with the field elements), a submit function, and call its `listen` method.

Form validation involves validating all fields.
A form is considered valid when all its fields are valid.

To validate an individual field (outside a form) you need to create a `Field` object and call its `listen` method.

A custom validator can be either a function or an object with a `validate` method, which must return a `ValidationResult` object. A field value is passed as argument. It can be promised, so you can use AJAX.

The `submit` function must return a `SubmissionResult` object. A `FormData` object is passed as argument. It can be promised, so you can use AJAX.

When a user submits a form, validation is performed first. If the form passes validation, submission is then executed.


#### `ValidationResult` class

| Method                                                    | Description                                                                      |
|-----------------------------------------------------------|----------------------------------------------------------------------------------|
| valid()                                                   | Static method. Creates a new valid result.                                       |
| invalid(message?: `string` = '')                          | Static method. Creates a new invalid result with a message.                      |
| make(result: `boolean`, message?: `string` = '')          | Static method. Creates a new valid or invalid result depending on the `result`.  |
| isValid(): `bool`                                         | Returns `true` if valid.                                                         |
| areValid(validationResults: `ValidationResult[]`): `bool` | Static method. Returns `true` if all the specified validation results are valid. |
| hasMessage(): `bool`                                      | Returns `true` if a message exists.                                              |
| getMessage(): `string`                                    | Retrieves the validation message.                                                |

#### `SubmissionResult` class

| Method                                                | Description                                      |
|-------------------------------------------------------|--------------------------------------------------|
| constructor(result: `boolean`, data?: ` object` = {}) | Creates a new submission result.                 |
| isPositive(): `boolean`                               | Returns `true` if submission result is positive. |
| getData(): `object`                                   | Retrieves the submission data.                   |

### Fields

#### `Field` class

| Method                                                                                                            | Description                                                                                                                                                                                                                                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| constructor (fieldSelector: `string`, containerSelector: `string`, validators?: `array`, options?: `object` = {}) | -`fieldSelector`: A selector to find the field element.<br/> -`containerSelector`: A selector to find the container element that contains the field element. Typically, this is the form selector.<br/>-`validators`: See the [Field validators](#field-validators).<br/>-`options`: See the [Field options](#field-options). |
| listen(): `void`                                                                                                  | Starts listening to events on the field element. This method must be called if the field is used outside of a form.                                                                                                                                                                                                           |

You must specify a CSS class for the field element and use it when specifying the `fieldSelector`.
For elements with the same name (e.g., radio buttons or a group of text input elements), use the same CSS class for all elements and a single `Field` object.
You can find examples in the [sandbox](./sandbox).

You must also specify a CSS class for the container element containing the field element and use it when specifying the `containerSelector`. If the field element is inside a form, the container element should be the form itself.

#### `Field` validators

An array of validators. Each validator can be: 
- A `string`: The name of the validator (e.g., `required` or any validator from the validator library, such as `isEmail`). 
- A `function`: A custom validator function that must return a `ValidationResult` object. Can be promised.
- An `object` with a `validate` method (that must return a `ValidationResult` object), such as the `FileValidator` (see [Validation of files](#validation-of-files)) or another custom object. Can be promised.

#### `Field` options

| Option                 | Type       | Default            | Description                                                                                                                                                                                                                                     |
|------------------------|------------|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| invalidMessages        | `object`   | `{}`               | Messages for invalid values for each validator. For example: `{isEmail: 'Invalid Email'}`.                                                                                                                                                      |
| defaultInvalidMessage  | `string`   | `'Invalid value.'` | A default message for invalid values if no specific message is provided in `invalidMessages`.                                                                                                                                                   |
| trimEnabled            | `boolean`  | `true`             | Specifies whether to trim the input value during validation.                                                                                                                                                                                    |
| typingDelay            | `number`   | 1000               | The delay (in milliseconds) to consider a user as "typing" when the time between keystrokes is less than this value.                                                                                                                            |
| validateOnChange       | `boolean`  | `false`            | Specifies whether to validate the field when its value changes.                                                                                                                                                                                 |
| validateOnType         | `boolean`  | `false`            | Specifies whether to validate the field during typing.                                                                                                                                                                                          |
| validatorParams        | `object`   | `{}`               | Parameters for [validator](https://www.npmjs.com/package/validator). For example: `{ isEmail: [{ allow_utf8_local_part: false }] }`.                                                                                                            |
| validationCacheEnabled | `boolean`  | `true`             | Specifies whether to cache the validation result until the value changes.                                                                                                                                                                       |
| onChange               | `function` | `NOOP`             | Triggered when the field value changes. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                            |
| onTypingStart          | `function` | `NOOP`             | Triggered when the user starts typing. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                             |
| onTypingEnd            | `function` | `NOOP`             | Triggered when the user stops typing. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                              |
| onBeforeValidate       | `function` | `NOOP`             | Triggered before field validation. Passed as arguments: `fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                                             |
| onAfterValidate        | `function` | `NOOP`             | Triggered after field validation. Passed as arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                          |
| onValidationError      | `function` | `NOOP`             | Triggered when an error occurs during validation. Passed as arguments: `error: any, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                  |
| onResetStatus          | `function` | `NOOP`             | Triggered when a status of the field is reset. Passed as arguments: `fieldElement: HTMLElement, containerElement: HTMLElement, wrapperElement: HTMLElement \| null`.                                                                            |
| setStatus              | `function` | `NOOP`             | Triggered when a status of the field needs to be changed. This cancels the [default behavior](#statuses). Passed as arguments: `status: string, fieldElement: HTMLElement, containerElement: HTMLElement, wrapperElement: HTMLElement \| null`. |

### Forms

#### `Form` class

| Method                                                                                            | Description                                                                                                                                                                                                                                                                          |
|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| constructor(formSelector: `string`, fields: `array`, submit: `function`, options?: `object` = {}) | -`formSelector`: A selector to find the form element.<br/> -`fields`: An array of `Field` objects.<br/> - `submit`: A submit function, (a `FormData` object is passed as argument, must return a `SubmissionResult` object),<br/> - `options`: See the [Form options](#form-options) |
| listen(): `void`                                                                                  | Executes the `listen` method for all fields specified in the `Form` constructor and starts listening for the form submission event. This method must be called.                                                                                                                      |

You must specify a CSS class for the form element and use it when specifying the `formSelector`.

#### `Form` options

The `Form` class supports all [Field options](#field-options) and applies them to each field specified in the `Form` constructor.  Field-specific options always take priority over form-level options.

Additionally, the `Form` class supports the following options:

| Option                 | Type       | Default | Description                                                                                                                                                                                                                                                                         |
|------------------------|------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| onBeforeValidate       | `function` | `NOOP`  | Triggered before form validation. Passed as argument: `formElement: HTMLFormElement`.                                                                                                                                                                                               |
| validate               | `function` | `NOOP`  | An additional custom validation function, which must return a `ValidationResult` object.  Passed as argument: `formData: FormData`. This is executed after field validation when all fields are valid. Can be promised.                                                             |
| onAfterValidate        | `function` | `NOOP`  | Triggered after form validation. Passed as arguments: `validationResults: ValidationReslut[], formElement: HTMLFormElement`. `validationResults` contains the results for each field and the form itself.                                                                           |
| onValidationError      | `function` | `NOOP`  | Triggered when an error occurs during validation. Passed as arguments: `error: any, formElement: HTMLFormElement`.                                                                                                                                                                  |
| onBeforeSubmit         | `function` | `NOOP`  | Triggered before form submission. Passed as arguments: `formData: FormData, formElement: HTMLFormElement`.                                                                                                                                                                          |
| onAfterSubmit          | `function` | `NOOP`  | Triggered after form submission.  Passed as arguments: `submissionResult: SubmissionResult, formElement: HTMLFormElement`.                                                                                                                                                          |
| onAfterPositiveSubmit  | `function` | `NOOP`  | Triggered after positive submission when the `submit` function returns a `SubmissionResult` object with a `true` value. Passed as arguments: `submissionResultData: object, formElement: HTMLFormElement`.                                                                          |
| onAfterNegativeSubmit  | `function` | `NOOP`  | Triggered after negative submission when the `submit` function returns a `SubmissionResult` object with a `false` value. Passed as arguments: `submissionResultData: object, formElement: HTMLFormElement`.                                                                         |
| onSubmissionError      | `function` | `NOOP`  | Triggered when an error occurs during submission. Passed as arguments: `error: any, formElement: HTMLFormElement`.                                                                                                                                                                  |
| onResetStatus          | `function` | `NOOP`  | Triggered when a status of the form is reset. Passed as arguments: `formElement: HTMLFormElement`.                                                                                                                                                                                  |
| setStatus              | `function` | `NOOP`  | Triggered when a status of the form needs to be changed. This cancels the [default behavior](#statuses). Passed as arguments: `status: string, formElement: HTMLFormElement`.                                                                                                       |
| onBeforeValidateField  | `function` | `NOOP`  | Triggered before validating any field specified in the `Form` constructor. Passed as arguments: `fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                                                         |
| onAfterValidateField   | `function` | `NOOP`  | Triggered after validating any field specified in the `Form` constructor. Passed as arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                      |
| onFieldValidationError | `function` | `NOOP`  | Triggered when an error occurs during the validation of any field specified in the `Form` constructor. Passed as arguments: `error: any, fieldElement: HTMLElement, containerElement: HTMLElement`.                                                                                 |
| onResetFieldStatus     | `function` | `NOOP`  | Triggered when a status of any field specified in the `Form` constructor is reset. Passed as arguments: `fieldElement: HTMLElement, containerElement: HTMLElement, wrapperElement: HTMLElement \| null`.                                                                            |
| setFieldStatus         | `function` | `NOOP`  | Triggered when a status of any field specified in the `Form` constructor needs to be changed. This cancels the [default behavior](#statuses). Passed as arguments: `status: string, fieldElement: HTMLElement, containerElement: HTMLElement, wrapperElement: HTMLElement \| null`. |

#### Important

The next options are intended for the entire form:
- `onBeforeValidate`
- `onAfterValidate`
- `onValidationError`
- `onResetStatus`
- `setStatus`

If you want to apply them to each field specified in the `Form` constructor use:

- `onBeforeValidateField`
- `onAfterValidateField`
- `onFieldValidationError`
- `onResetFieldStatus`
- `setFieldStatus`

### Validation of files

Use the `FileValidator` for file validation. See an example of usage in the [sandbox](./sandbox).

The `FileValidator` constructor accepts two objects: `rules` and `invalidMessages`.

| Rule               | Example                      | Related option for invalid message | Allowed placeholders                                                                                                                               |
|--------------------|------------------------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| maxSize (in bytes) | `1073741824`                 | maxSize                            | `{file}`, `{fileSize}`, `{fileSizeInKib}`, `{fileSizeInMiB}`, `{fileSizeInGiB}`, `{maxSize}`, `{maxSizeInKiB}`, `{maxSizeInMiB}`, `{maxSizeInGiB}` |
| allowedMimeTypes   | `['image/jpg', 'image/png']` | allowedMimeTypes                   | `{file}`, `{fileMimeType}`, `{allowedMimeTypes}`                                                                                                   |
| allowedExtensions  | `['.jpg', '.png']`           | allowedExtensions                  | `{file}`, `{allowedExtensions}`                                                                                                                    |
| maxCount           | `3`                          | maxCount                           | `{maxCount}`                                                                                                                                       |

Example: 

```JS
new Field('.js-file', '.js-container', [
    new FileValidator({ maxSize: 536870912, allowedMimeTypes: ['image/jpg'] }, { maxSize: 'The size of {file} must be less than {maxSizeInMiB} MiB.' })
])
```

### Statuses

Special CSS classes are dynamically added to form and field elements during validation and submission:

- `ff-field-validating`
- `ff-field-valid`
- `ff-field-invalid`
- `ff-form-validating`
- `ff-form-valid`
- `ff-form-invalid`
- `ff-form-submitting`
- `ff-form-positive-submit`
- `ff-form-negative-submit`

You can wrap any field element in a container with the `data-field-wrapper` attribute.
The special classes will then be applied to this wrapper instead of the field element itself. This is particularly useful for checkboxes and radio buttons.

The `onResetStatus` callback can be useful for clearing form or field errors that were set using the `onAfterValidate` or `onAfterNegativeSubmit` callbacks, for example.

You can use a custom `setStatus` function by passing it to the `Field` or `Form` options. In this case, special CSS classes will not be added automatically.

## License

This library is released under the [MIT license](./LICENSE).
