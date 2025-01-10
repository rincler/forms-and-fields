import Form from '../src/Form';
import Field from '../src/Field';
import SubmissionResult from '../src/SubmissionResult';
import ValidationResult from '../src/ValidationResult';
import FileValidator from '../src/validators/FileValidator';

const form = new Form(
    '.js-form',
    [
        new Field('.js-email', '.js-form', ['required', 'isEmail'], {
            invalidMessages: {
                required: 'Email is required',
                isEmail: 'Invalid email',
            },
        }),
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
        console.log(formData);
        // here can be AJAX-request
        return new SubmissionResult(true);
    },
    {
        onAfterValidateField: (validationResult) => {
            // eslint-disable-next-line no-console
            console.log(validationResult);
        },
        onChange: (value) => {
            // eslint-disable-next-line no-console
            console.log(value);
        },
    }
);

form.listen();

const fqdnField = new Field('.js-fqdn', '.js-container', ['required', 'isFQDN'], {
    validateOnType: true,
});

fqdnField.listen();

const mapResponseTypeToUrl = (value) => {
    if (value === 'success') {
        return '/submit-with-success-response';
    }

    if (value === 'error') {
        return '/submit-with-error-response';
    }

    if (value === 'http-error') {
        return '/submit-with-http-error-response';
    }

    throw new Error('Invalid argument.');
};

const registerForm = new Form(
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
    }
);

registerForm.listen();

const domainsForm = new Form(
    '.js-domains-form',
    [
        new Field('.js-domain', '.js-domains-form', [
            'isFQDN',
            (value) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(new ValidationResult(!['example.com', 'example.net'].includes(value)));
                    }, 2000);
                });
            },
        ]),
    ],
    () => {
        return new SubmissionResult(true);
    }
);

domainsForm.listen();

const uploadForm = new Form(
    '.js-upload-form',
    [
        new Field(
            '.js-upload',
            '.js-upload-form',
            [
                new FileValidator(
                    { allowedMimeTypes: ['image/jpeg'], maxSize: 307200, maxCount: 2, allowedExtensions: ['.jpg'] },
                    {
                        allowedMimeTypes:
                            'The "{file}" file has invalid MIME type. MIME type of file: {fileMimeType}. Allowed MIME types: {allowedMimeTypes}.',
                        maxSize:
                            'The "{file}" file exceeded the allowed max file size: {maxSizeInKiB} KiB. File size: {fileSizeInKib} KiB.',
                    }
                ),
            ],
            {
                onAfterValidate: (validationResult) => {
                    // eslint-disable-next-line no-console
                    console.log(validationResult);
                },
            }
        ),
    ],
    async () => {
        return new SubmissionResult(true);
    }
);

uploadForm.listen();
