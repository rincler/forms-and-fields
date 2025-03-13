# Forms and Fields

[![NPM Version](https://img.shields.io/npm/v/forms-and-fields)](https://www.npmjs.com/package/forms-and-fields)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/rincler/forms-and-fields/ci.yml?branch=master)

A library for field validation and form submission.

Field elements are elements like input (of any type), select and textarea. Each field is defined by validation rules — validators.

You can use the `required` validator, 
any validator from the [validator](https://www.npmjs.com/package/validator) library (e.g. `isEmail`), 
the `FileValidator` or your own custom validators (including AJAX-based validation).

## Usage

**HTML:**
```HTML
<form class="js-form">
    <div>
        <label for="email">Email:</label>
        <br />
        <input id="email" type="text" name="email" class="js-email" />
    </div>
    <div>
        <label for="password">Password:</label>
        <br />
        <input id="password" type="password" name="password" class="js-password" />
    </div>
    <br />
    <button type="submit">Login</button>
</form>
```

**JS:**
```JS
import {
    Form,
    Field,
    FieldStatus,
    FormStatus,
    SubmissionResult
} from "forms-and-fields";

const form = new Form(
    ".js-form",
    [
        new Field(".js-email", ".js-form", ["required", "isEmail"]),
        new Field(".js-password", ".js-form", ["required"])
    ],
    (formData) => {
        const isOk =
            formData.get("email") === "test@example.com" &&
            formData.get("password") === "123456";
        return SubmissionResult.make(isOk, "Incorrect credentials");
    },
    {
        invalidMessages: {
            required: "This field is required",
            isEmail: "Invalid email"
        },
        onFieldStatusChange: (status, validationResult, fieldElement) => {
            if (status === FieldStatus.No) {
                fieldElement.parentNode.querySelector(".error")?.remove();
            }

            if (status === FieldStatus.Invalid) {
                fieldElement.insertAdjacentHTML(
                    "afterend",
                    `<div class="error">${validationResult.getMessage()}</div>`
                );
            }
        },
        onStatusChange: (
            status,
            validationResult,
            submissionResult,
            formElement
        ) => {
            if (status === FormStatus.No) {
                formElement.querySelector(".form-error")?.remove();
            }

            if (status === FormStatus.NegativeSubmit) {
                formElement.insertAdjacentHTML(
                    "beforeend",
                    `<div class="form-error"><br />${submissionResult.getMessage()}</div>`
                );
            }

            if (status === FormStatus.PositiveSubmit) {
                formElement.replaceWith("You are logged in");
            }
        }
    }
);

form.listen();
```

You can experiment with the code above in [CodePen](https://codepen.io/rincler/pen/ogNeXxM).

**More examples:**

Find more examples in the [sandbox](./sandbox).

## Installation

    npm install forms-and-fields

Or without installation and build tools:

```HTML
<script type="module">
    import { Field } from 'https://esm.sh/forms-and-fields';
</script>
```
## Documentation

### Common

To validate and submit a form, you need to create a `Form` object with `Field` objects (associated with the field elements), a submit function, and call its `listen` method.

Form validation involves validating all fields. A form is considered valid when all its fields are valid.

To validate an individual field (outside a form) you need to create a `Field` object and call its `listen` method.

When a user submits a form, validation is performed first. If the form passes validation, submission is then executed.

### Validation and Submission results

Any custom validator must return a `ValidationResult` object. The internal validators return `ValidationResult` also.

#### `ValidationResult` class

| Method                                                                                                                            | Description                                                                                                                                                            |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| valid(resultDetails: `object \| string` = {})                                                                                     | Static method. Creates a new valid result. The `resultDetails` object is expected to have the keys `message` and/or `data`. The `resultDetails` string is a message.   |
| invalid(resultDetails: `object \| string` = {})                                                                                   | Static method. Creates a new invalid result. The `resultDetails` object is expected to have the keys `message` and/or `data`. The `resultDetails` string is a message. |
| make(result: `boolean`, resultDetailsForInvalidCase: `object \| string` = {}, resultDetailsForValidCase: `object \| string` = {}) | Static method. Creates a new valid or invalid result depending on the `result`.                                                                                        |
| isValid(): `bool`                                                                                                                 | Returns `true` if valid.                                                                                                                                               |
| isInvalid(): `bool`                                                                                                               | Returns `true` if invalid.                                                                                                                                             |
| areValid(validationResults: `ValidationResult[]`): `bool`                                                                         | Static method. Returns `true` if all the specified validation results are valid.                                                                                       |
| hasMessage(): `bool`                                                                                                              | Returns `true` if a message exists.                                                                                                                                    |
| getMessage(): `string`                                                                                                            | Returns the message.                                                                                                                                                   |
| getData(): `object`                                                                                                               | Returns the data.                                                                                                                                                      |

A form `submit` function must return a `SubmissionResult` object.

#### `SubmissionResult` class

| Method                                                                                                                                | Description                                                                                                                                                                                                                                                                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| positive(resultDetails: `object \| string` = {})                                                                                      | Static method. Creates a new positive result. The `resultDetails` object is expected to have the keys `message` and/or `data`. The `resultDetails` string is a message.                                                                                                                                                                         |
| invalid(invalidData: `object`, data: `object` = {})                                                                                   | Static method. Creates a new negative result with invalid data. The `invalidData` is an object in the following format: `{ [invalidFieldName]: message }`, for groups: `{ [invalidFieldName.index]: message }`, and for the entire form: `{"*": message}`. In this case, the form will set statuses and messages for the corresponding fields . |
| negative(resultDetails: `object \| string` = {})                                                                                      | Static method. Creates a new negative result. The `resultDetails` object is expected to have the keys `message` and/or `data`. The `resultDetails` string is a message.                                                                                                                                                                         |
| make(result: `boolean`, resultDetailsForNegativeCase: `object \| string` = {}, resultDetailsForPositiveCase: `object \| string` = {}) | Static method. Creates a new positive or negative result depending on the `result`.                                                                                                                                                                                                                                                             |
| isPositive(): `boolean`                                                                                                               | Returns `true` if positive.                                                                                                                                                                                                                                                                                                                     |
| isNegative(): `boolean`                                                                                                               | Returns `true` if negative.                                                                                                                                                                                                                                                                                                                     |
| isValid(): `boolean`                                                                                                                  | Returns `true` if valid (i.e., it was not created by the `invalid` method).                                                                                                                                                                                                                                                                     |
| isInvalid(): `boolean`                                                                                                                | Returns `true` if invalid (i.e., it was created by the `invalid` method).                                                                                                                                                                                                                                                                       |
| hasMessage(): `boolean`                                                                                                               | Returns `true` if a message exists.                                                                                                                                                                                                                                                                                                             |
| getMessage(): `boolean`                                                                                                               | Returns the message.                                                                                                                                                                                                                                                                                                                            |
| getData(): `object`                                                                                                                   | Returns the data.                                                                                                                                                                                                                                                                                                                               |

### Fields

#### `Field` class

| Method                                                                                                               | Description                                                                                                                                                                                                                                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| constructor (fieldSelector: `string`, containerSelector: `string`, validators: `array` = [], options: `object` = {}) | -`fieldSelector`: A selector to find the field element.<br/> -`containerSelector`: A selector to find the container element that contains the field element. Typically, this is the form selector.<br/>-`validators`: See the [Field validators](#field-validators).<br/>-`options`: See the [Field options](#field-options). |
| listen(): `() => void`                                                                                               | Starts listening to events on the field element. This method must be called if the field is used outside of a form. Returns a function that stops listening.                                                                                                                                                                  |

You can specify a CSS class for the field element and use it in the `fieldSelector` parameter.
For elements with the same name (e.g., radio buttons or a group of text input elements), use a single `Field` object and specify a selector to find the first element.
You can find examples in the [sandbox](./sandbox).

You can also specify a CSS class for the container element containing the field element and use it in the `containerSelector` parameter. If the field element is inside a form, the container element should be the form itself.

#### `Field` validators

An array of validators. Each validator can be: 
- A `string`: The name of the validator (e.g., `required` or any validator from the [validator](https://www.npmjs.com/package/validator) library, such as `isEmail`). 
- A `function`: A custom validator function that must return a `ValidationResult` object. Can be promised.
- An `object` with a `validate` method (that must return a `ValidationResult` object), such as the `FileValidator` (see [Validation of files](#validation-of-files)) or another custom object. Can be promised.

#### `Field` options

| Option                 | Type       | Default            | Description                                                                                                                                                                                                            |
|------------------------|------------|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| invalidMessages        | `object`   | `{}`               | Messages for invalid values for each validator. For example: `{isEmail: 'Invalid Email'}`.                                                                                                                             |
| defaultInvalidMessage  | `string`   | `'Invalid value.'` | A default message for invalid values if no specific message is provided in the `invalidMessages`.                                                                                                                      |
| trimEnabled            | `boolean`  | `true`             | Specifies whether to trim the input value before validation.                                                                                                                                                           |
| typingDelay            | `number`   | 1000               | The delay (in milliseconds) to consider a user as "typing" when the time between keystrokes is less than this value.                                                                                                   |
| validateOnChange       | `boolean`  | `false`            | Specifies whether to validate the field when its value changes.                                                                                                                                                        |
| validateOnType         | `boolean`  | `false`            | Specifies whether to validate the field during typing.                                                                                                                                                                 |
| validatorParams        | `object`   | `{}`               | Parameters for [validator](https://www.npmjs.com/package/validator). For example: `{ isEmail: [{ allow_utf8_local_part: false }] }`.                                                                                   |
| validationCacheEnabled | `boolean`  | `true`             | Specifies whether to cache the validation result until the value changes.                                                                                                                                              |
| cssStatusEnabled       | `boolean`  | `true`             | Specifies whether to add CSS classes when the status changes.                                                                                                                                                          |
| onChange               | `function` | `NOOP`             | Triggered when the field value changes. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: Element`.                                                                                       |
| onTypingStart          | `function` | `NOOP`             | Triggered when the user starts typing. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: Element`.                                                                                        |
| onTypingEnd            | `function` | `NOOP`             | Triggered when the user stops typing. Passed as arguments: `value: any, fieldElement: HTMLElement, containerElement: Element`.                                                                                         |
| onBeforeValidate       | `function` | `NOOP`             | Triggered before field validation. Passed as arguments: `fieldElement: HTMLElement, containerElement: Element`.                                                                                                        |
| onAfterValidate        | `function` | `NOOP`             | Triggered after field validation. Passed as arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, containerElement: Element`.                                                                     |
| onValidationError      | `function` | `NOOP`             | Triggered when an error occurs during validation. Passed as arguments: `error: any, fieldElement: HTMLElement, containerElement: Element`.                                                                             |
| onStatusChange         | `function` | `NOOP`             | Triggered when the field status changes. Passed as arguments: `status: string, validationResult: ValidationResult \| null, fieldElement: HTMLElement, containerElement: Element, wrapperElement: HTMLElement \| null`. |
| onStatusReset          | `function` | `NOOP`             | Triggered when the field status resets. Passed as arguments: `fieldElement: HTMLElement, containerElement: Element, wrapperElement: HTMLElement \| null`.                                                              |

### Forms

#### `Form` class

| Method                                                                                           | Description                                                                                                                                                                                                                                                                          |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| constructor(formSelector: `string`, fields: `array`, submit: `function`, options: `object` = {}) | -`formSelector`: A selector to find the form element.<br/> -`fields`: An array of `Field` objects.<br/> - `submit`: A submit function, (a `FormData` object is passed as argument, must return a `SubmissionResult` object),<br/> - `options`: See the [Form options](#form-options) |
| listen(): `() => void`                                                                           | Executes the `listen` method for all fields specified in the `Form` constructor and starts listening for the form submission event. This method must be called. Returns a function that stops listening.                                                                             |

You can specify a CSS class for the form element and use it in the `formSelector` parameter.

#### `Form` options

The `Form` class supports all [Field options](#field-options) and applies them to each field specified in the `Form` constructor.  Field-specific options always take priority over form-level options.

Additionally, the `Form` class supports the following options:

| Option                 | Type       | Default | Description                                                                                                                                                                                                                                                     |
|------------------------|------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| cssStatusEnabled       | `boolean`  | `true`  | Specifies whether to add CSS classes when the status changes.                                                                                                                                                                                                   |
| onBeforeValidate       | `function` | `NOOP`  | Triggered before form validation. Passed as argument: `formElement: HTMLFormElement`.                                                                                                                                                                           |
| validate               | `function` | `NOOP`  | An additional custom validation function, which must return a `ValidationResult` object.  Passed as argument: `formData: FormData`. This is executed after field validation when all fields are valid. Can be promised.                                         |
| onAfterValidate        | `function` | `NOOP`  | Triggered after form validation. Passed as arguments: `validationResult: { [fieldName]: ValidationResult, "*": ValidationResult }, formElement: HTMLFormElement`. `validationResults` contains the results for each field and the form itself.                  |
| onValidationError      | `function` | `NOOP`  | Triggered when an error occurs during validation. Passed as arguments: `error: any, formElement: HTMLFormElement`.                                                                                                                                              |
| onBeforeSubmit         | `function` | `NOOP`  | Triggered before form submission. Passed as arguments: `formData: FormData, formElement: HTMLFormElement`.                                                                                                                                                      |
| onAfterSubmit          | `function` | `NOOP`  | Triggered after form submission.  Passed as arguments: `submissionResult: SubmissionResult, formElement: HTMLFormElement`.                                                                                                                                      |
| onSubmissionError      | `function` | `NOOP`  | Triggered when an error occurs during submission. Passed as arguments: `error: any, formElement: HTMLFormElement`.                                                                                                                                              |
| onStatusChange         | `function` | `NOOP`  | Triggered when the form status changes. Passed as arguments: `status: string, validationResult: { [fieldName]: ValidationResult, "*": ValidationResult } \| null, submissionResult: SubmissionResult \| null, formElement: HTMLFormElement`.                    |
| onStatusReset          | `function` | `NOOP`  | Triggered when the form status resets. Passed as arguments: `formElement: HTMLFormElement`.                                                                                                                                                                     |
| onBeforeValidateField  | `function` | `NOOP`  | Triggered before validating any field specified in the `Form` constructor. Passed as arguments: `fieldElement: HTMLElement, containerElement: Element`.                                                                                                         |
| onAfterValidateField   | `function` | `NOOP`  | Triggered after validating any field specified in the `Form` constructor. Passed as arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, containerElement: Element`.                                                                      |
| onFieldValidationError | `function` | `NOOP`  | Triggered when an error occurs while validating any field specified in the `Form` constructor. Passed as arguments: `error: any, fieldElement: HTMLElement, containerElement: Element`.                                                                         |
| onFieldStatusChange    | `function` | `NOOP`  | Triggered when a status of any field specified in the `Form` constructor changes. Passed as arguments: `status: string, validationResult: ValidationResult \| null, fieldElement: HTMLElement, containerElement: Element, wrapperElement: HTMLElement \| null`. |
| onFieldStatusReset     | `function` | `NOOP`  | Triggered when a status of any field specified in the `Form` constructor resets. Passed as arguments: `fieldElement: HTMLElement, containerElement: Element, wrapperElement: HTMLElement \| null`.                                                              |

#### Important

The next options are intended for the entire form:
- `onBeforeValidate`
- `onAfterValidate`
- `onValidationError`
- `onStatusChange`
- `onStatusReset`

If you want to apply them to each field specified in the `Form` constructor use:

- `onBeforeValidateField`
- `onAfterValidateField`
- `onFieldValidationError`
- `onFieldStatusChange`
- `onFieldStatusReset`

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
    new FileValidator({ maxSize: 536870912, allowedMimeTypes: ['image/jpg'] }, { maxSize: 'The size of {file} must be less than {maxSizeInMiB} MiB.' });
])
```

### Radio buttons

Use a single `Field` object for radio buttons with the same name:

HTML:
```HTML
<form class="js-form">
    <input id="sex-man" type="radio" name="sex" class="js-sex" value="man" />
    <label for="sex-man">Man</label>
    <input id="sex-woman" type="radio" name="sex" class="js-sex" value="woman" />
    <label for="sex-woman">Woman</label>
    <button type="submit">Submit</button>
</form>
```

JS:
```JS
import { Form, Field, SubmissionResult } from "forms-and-fields";

const form = new Form(
    ".js-form",
    [
        new Field(".js-sex", ".js-form", ["required"]),
    ],
    (formData) => SubmissionResult.positive()},
);

form.listen();
```

### Groups

Sometimes it's necessary to add fields with the same name, for example, a group of addresses. In this case, use the `data-group-field` attribute and a single `Field` object:

HTML:
```HTML
<form class="js-form">
    <div>
        <label for="address-1">Address 1:</label>
        <br />
        <input id="address-1" type="text" name="address" class="js-address" data-group-field="" />
    </div>
    <div>
        <label for="address-2">Address 2:</label>
        <br />
        <input id="address-2" type="text" name="address" class="js-address" data-group-field="" />
    </div>
    <br />
    <button type="button">Add an address</button>
    <br />
    <button type="submit">Submit</button>
</form>
```

JS:
```JS
import { Form, Field, SubmissionResult } from "forms-and-fields"

const form = new Form(
    ".js-form",
    [
        new Field(".js-address", ".js-form", ["required"]),
    ],
    (formData) => SubmissionResult.positive()},
)

form.listen()
```

**Important!** Don't use the `data-group-field` attribute for radio buttons.

### Statuses

The statuses of forms and fields change during validation and submission. You can subscribe to these events via `onStatusChange`.

List of statuses:

- `FieldStatus.Validating` (`"ff-field-validating"`)
- `FieldStatus.Valid` (`"ff-field-valid"`)
- `FieldStatus.Invalid` (`"ff-field-invalid"`)
- `FormStatus.Validating` (`"ff-form-validating"`)
- `FormStatus.Valid` (`"ff-form-valid"`)
- `FormStatus.Invalid` (`"ff-form-invalid"`)
- `FormStatus.Submitting` (`"ff-form-submitting"`)
- `FormStatus.PositiveSubmit` (`"ff-form-positive-submit"`)
- `FormStatus.NegativeSubmit` (`"ff-form-negative-submit"`)

Also, by default, statuses are dynamically added as CSS classes to form and field elements.

You can wrap any field element in a container with the `data-field-wrapper` attribute then
the classes will then be applied to this wrapper instead of the field element itself. This is particularly useful for checkboxes and radio buttons.
To disable adding CSS classes, set `cssStatusEnabled` to `false`.

The `onResetStatus` callback can be useful for clearing form or field errors that were set using the `onAfterValidate` or `onAfterSubmit` callbacks, for example.

## License

This library is released under the [MIT license](./LICENSE).
