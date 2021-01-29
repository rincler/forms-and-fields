# Forms and Fields

[![NPM Version](https://img.shields.io/npm/v/forms-and-fields)](https://www.npmjs.com/package/forms-and-fields)

A library to validation fields and submission forms.

For validation you can use `required` validator, 
one of [validator](https://www.npmjs.com/package/validator) validators (e.g. `isEmail`) 
or custom validator (including AJAX).

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

const form = new Form('.js-form', [
   new Field('.js-email', ['required', 'isEmail'], {
        invalidMessages: {
            required: 'Email is required',
            isEmail: 'Invalid email'
        }
   })
], {
    onAfterFieldValidate: (validationResult) => {
        console.log(validationResult);
    },
    submit: (formData) => {
        console.log(formData);
        // here can be AJAX-request
        return new SubmissionResult(true);
    }
});

form.listen();
```
**Console:**

When you submit form with empty email:
```
ValidationResult {result: false, message: "Email is required"}
```

When you submit form with invalid email:
```
ValidationResult {result: false, message: "Invalid email"}
```

When you submit form with valid email:
```
ValidationResult {result: true, message: ""}
FormData {}
```

**Extended example:**

See more extended examples in [sandbox](./sandbox.dist) 

## Installation

    npm install forms-and-fields

## Documentation

### Common

For validation and submission form you need create `Form` object (with needed `Field` objects) and call `listen` method.

Form validation is all fields validation and form is valid when all fields are valid.

For validation separate fields you need create `Field` object and call `listen` method.

Custom validators must return `ValidationResult` (can return `Promise`, so you can use AJAX).

Form `submit` callback must return `SubmissionResult` (can return `Promise`, so you can use AJAX).

Validation is triggered when user submits form. Form is not submitting if form is invalid.


#### `ValidationResult` class

| Method                                                   | Description                                |
|----------------------------------------------------------|--------------------------------------------|
| constructor(result: `boolean`, message?: `string` = '')  | Initializes validation result object       |
| isValid(): `bool`                                        | Returns boolean validation result          |
| hasMessage(): `bool`                                     | Returns validation result message existing |
| setMessage(message: `string`): `void`                    | Sets validation result message             |
| getMessage(): `string`                                   | Returns validation result message          |

#### `SubmissionResult` class

| Method                                                | Description                                        |
|-------------------------------------------------------|----------------------------------------------------|
| constructor(result: `boolean`, data?: ` object` = {}) | Initializes submission result object with any data |
| isSuccess(): `boolean`                                | Returns boolean submission result                  |
| getData(): `object`                                   | Returns data                                       |

### Fields

#### `Field` class

| Method                                                                                | Description                                                                                                                                  |
|---------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| constructor (fieldSelector: `string`, validators: `object`, options?: `object` = {})  | Initializes field object with validators (see `Field` validators) and options (see `Field` options) for field with `fieldSelector` selector  |
| setOptions(options: `object`): `void`                                                 | Sets options (see `Field` options)                                                                                                           |
| listen(): `void`                                                                      | Starts listening field for triggering validation and trimming (if enabled)                                                                   |
| isValid(force: `boolean`): `Promise<boolean>`                                         | Returns boolean validation result  (if field not yet validated  or `force` is `true` then field is validated).                               |
| validate(): `Promise<void>`                                                           | Validates field                                                                                                                              |

#### `Field` validators

Array of validators. Each validator can be `string` (name of validator) or `function` (custom validator). 
Allowed validator names: `required` or one of [validator](https://www.npmjs.com/package/validator) validators (e.g. `isEmail`). 
It is allowed only `required` validator for checkbox, select, radio and file input elements. 

#### `Field` options

| Option                | Type          | Default            | Description                                                                                                                                         |
|-----------------------|---------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| formElement           | `HTMLElement` | `document`         | Form element that contains field                                                                                                                    |
| validMessage          | `string`      | `''`               | Message about valid value that passing to `ValidationResult`                                                                                        |
| invalidMessages       | `object`      | `{}`               | Messages about invalid value for each validator that passing to `ValidationResult`. E.g. `{isEmail: 'Invalid Email'}`                               |
| defaultInvalidMessage | `string`      | `'Invalid value.'` | Message about invalid value that passing to `ValidationResult` (if not found in `invalidMessages`)                                                  |
| validateOnChange      | `boolean`     | `false`            | Whether to validate on change field value                                                                                                           |
| validateOnType        | `boolean`     | `false`            | Whether to validate on typing field value                                                                                                           |
| typingDelay           | `number`      | 1000               | It is considered that user is typing when time between taps less than this value (ms)                                                               |
| onTypingStart         | `function`    | `null`             | It is triggered when user has started typing. Passes arguments: `value: string, fieldElement: HTMLElement, formElement: HTMLElement`                |
| onTypingEnd           | `function`    | `null`             | It is triggered when user has finished typing. Passes arguments: `value: string, fieldElement: HTMLElement, formElement: HTMLElement`               |
| onChange              | `function`    | `null`             | It is triggered when user has changed field. Passes arguments: `value: string, fieldElement: HTMLElement, formElement: HTMLElement`                 |
| validatorParams       | `object`      | `{}`               | Params for [validator](https://www.npmjs.com/package/validator). (E.g. `{isEmail: {allow_utf8_local_part: false}}`)                                 |
| trimEnabled           | `boolean`     | `true`             | Whether to trim field value on validation                                                                                                           |
| onBeforeValidate      | `function`    | `null`             | It is triggered before field validation. Passes arguments: `fieldElement: HTMLElement, formElement: HTMLElement`                                    |
| onAfterValidate       | `function`    | `null`             | It is triggered after field validation. Passes arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, formElement: HTMLElement` |

### Forms

#### `Form` class

| Method                                                                               | Description                                                                                                                     |
|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| constructor(formSelector: `string`, fields?: `object` = [], options?: `object` = {}) | Initializes form object with fields (see `Field` class) and options (see `Form` options)  for form with `formSelector` selector |
| listen(): `void`                                                                     | Starts listening form for triggering validation, trimming (if enabled, for each field) and submission                           |
| isValid(force: `boolean`): `Promise<boolean>`                                        | Returns boolean validation result  (calls `isValid` method for each field)                                                      |
| validate(): `Promise<void>`                                                          | Validates form (each field)                                                                                                     |

#### `Form` options

`Form` supports all `Field` options (besides `formElement`) and sets this options to each form field (`Field` options have higher priority). 

Also `Form` supports following options:

| Option                | Type       | Default | Description                                                                                                                                                                                                                                                                                                                                 |
|-----------------------|------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| onBeforeValidate      | `function` | `null`  | It is triggered before form validation. Passes argument `formElement: HTMLElement`                                                                                                                                                                                                                                                          |
| onAfterValidate       | `function` | `null`  | It is triggered after form validation. Passes arguments: `isValid: boolean, formElement: HTMLElement`                                                                                                                                                                                                                                       |
| onBeforeSubmit        | `function` | `null`  | It is triggered when user submits form and before validation. Passes `formData: FormData, formElement: HTMLElement`                                                                                                                                                                                                                         |
| submit                | `function` | `null`  | Submit function. It is triggered when user submits form and after validation. Must return `SubmissionResult` (can return `Promise`, so you can use AJAX). If exception occurred it is  equivalent to `submit` returned  `SubmissionResult` with `false` (error is logged to console). Passes `formData: FormData, formElement: HTMLElement` |
| onAfterSubmit         | `function` | `null`  | It is triggered after submission.  Passes `submissionResult: SubmissionResult, formElement: HTMLElement`                                                                                                                                                                                                                                    |
| onAfterSubmitSuccess  | `function` | `null`  | It is triggered after submission and `submit` function returned `SubmissionResult` with `true`. Passes `submissionResultData: object, formElement: HTMLElement`                                                                                                                                                                             |
| onAfterSubmitError    | `function` | `null`  | It is triggered after submission and `submit` function returned `SubmissionResult` with `false`. Passes `submissionResultData: object, formElement: HTMLElement`                                                                                                                                                                            |
| onBeforeFieldValidate | `function` | `null`  | It is triggered before each field validation. Passes arguments: `fieldElement: HTMLElement, formElement: HTMLElement`                                                                                                                                                                                                                       |
| onAfterFieldValidate  | `function` | `null`  | It is triggered after each field validation. Passes arguments: `validationResult: ValidationResult, fieldElement: HTMLElement, formElement: HTMLElement`                                                                                                                                                                                    |

To set `onBeforeValidate` or `onAfterValdiate` to each form field use `onBeforeFieldValidate` or `onAfterFieldValidate`, 
because `onBeforeValidate` and `onAfterValidate` are for form.

### CSS classes

Special CSS classes are added dynamically to form and fields on validation and submission:
- `f-field-validating`
- `f-field-valid`
- `f-field-invalid`
- `f-form-validating`
- `f-form-valid`
- `f-form-invalid`
- `f-form-submitting`
- `f-form-submit-success`
- `f-form-submit-error`

You can wrap one field by container element with `js-f-field-container` css class 
and then special classes will be added to it. This is especially useful for checkboxes and radio elements.

## License

This library is released under the [MIT license](./LICENSE).
