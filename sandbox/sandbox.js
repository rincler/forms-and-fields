import Form from '../src/Form';
import Field from '../src/Field';
import SubmissionResult from '../src/SubmissionResult';
import ValidationResult from '../src/ValidationResult';
import FileValidator from '../src/validators/FileValidator';

const clearErrors = (fieldElement) => {
    fieldElement.parentNode.querySelectorAll('.error').forEach(e => e.remove());
};

const form = new Form(
    '.js-form',
    [
        new Field('.js-email', '.js-form', ['required', 'isEmail']),
        new Field('.js-secret-word', '.js-form', ['equals'], {
            validatorParams: {
                equals: ['sun'],
            },
        }),
        new Field('.js-sex', '.js-form', ['required']),
        new Field('.js-agree', '.js-form', ['required']),
        new Field('.js-city', '.js-form', ['required']),
        new Field('.js-movie', '.js-form', ['required']),
        new Field('.js-file', '.js-form', ['required']),
    ],
    (formData) => {
        // eslint-disable-next-line no-console
        console.log(Object.fromEntries(formData));
        // here can be AJAX-request
        return new SubmissionResult(true);
    },
);

form.listen();

const domainField = new Field('.js-domain', '.js-container', ['required', 'isFQDN', async (value) => {
    const response = await fetch(`/check-domain?domain=${encodeURIComponent(value)}`);
    const result = await response.json();

    return new ValidationResult(result.isValid, result.isValid ? '' : 'The domain must be in the .com zone.');
}], {
    invalidMessages: {
        required: 'Domain is required.',
        isFQDN: 'Domain is not valid.',
    },
    validateOnType: true,
    onBeforeValidate: (fieldElement) => {
        clearErrors(fieldElement);
    },
    onAfterValidate: (validationResult, fieldElement) => {
        clearErrors(fieldElement);
        if (validationResult.isValid()) {
            return;
        }
        fieldElement.insertAdjacentHTML(
            'afterend',
            `<div class="error">${validationResult.getMessage()}</div>`,
        );
    },
});

domainField.listen();

const mapResponseTypeToUrl = (value) => {
    if (value === 'success') {
        return '/response-with-success';
    }

    if (value === 'error') {
        return '/response-with-error';
    }

    if (value === 'http-error') {
        return '/response-with-http-error';
    }

    throw new Error('Invalid argument.');
};

const registrationForm = new Form(
    '.js-register-form',
    [
        new Field('.js-login', '.js-register-form', [
            'required',
            async (value) => {
                const response = await fetch(`/check-login?login=${encodeURIComponent(value)}`);
                const result = await response.json();

                return new ValidationResult(result.isValid);
            },
        ]),
        new Field('.js-password', '.js-register-form', ['required']),
        new Field('.js-confirm-password', '.js-register-form', [
            'required',
            (value) => {
                const password = document.querySelector('.js-password').value;

                return new ValidationResult(value === password);
            },
        ]),
    ],
    async (formData) => {
        const data = {
            login: formData.get('login'),
            password: formData.get('password'),
        };

        const url = mapResponseTypeToUrl(formData.get('response'));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        return new SubmissionResult(result.isSuccess);
    },
);

registrationForm.listen();

const emailListForm = new Form(
    '.js-email-list-form',
    [
        new Field('.js-email', '.js-email-list-form', ['required', 'isEmail']),
    ],
    () => {
        return new SubmissionResult(true);
    },
);

emailListForm.listen();

const uploadForm = new Form(
    '.js-upload-file-form',
    [
        new Field(
            '.js-upload-file',
            '.js-upload-file-form',
            [
                new FileValidator(
                    {
                        allowedMimeTypes: ['image/jpg', 'image/jpeg'],
                        maxSize: 307200,
                        maxCount: 2,
                        allowedExtensions: ['.jpg'],
                    },
                    {
                        allowedMimeTypes:
                            'The "{file}" file has an invalid MIME type. The MIME type of the file: {fileMimeType}. The allowed MIME types are: {allowedMimeTypes}.',
                        allowedExtensions: '"{file}" file has invalid extension.',
                        maxSize:
                            'The "{file}" file exceeded the allowed maximum file size: {maxSizeInKiB} KiB. The file size is {fileSizeInKib} KiB.',
                    },
                ),
            ],
            {
                onBeforeValidate: (fieldElement) => {
                    clearErrors(fieldElement);
                },
                onAfterValidate: (validationResult, fieldElement) => {
                    clearErrors(fieldElement);
                    if (validationResult.isValid()) {
                        return;
                    }
                    fieldElement.insertAdjacentHTML(
                        'afterend',
                        `<div class="error">${validationResult.getMessage()}</div>`,
                    );
                },
            },
        ),
    ],
    async () => {
        return new SubmissionResult(true);
    },
);

uploadForm.listen();
