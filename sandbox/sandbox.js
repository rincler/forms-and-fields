import Form from '../src/Form';
import Field from '../src/Field';
import SubmissionResult from '../src/SubmissionResult';
import ValidationResult from '../src/ValidationResult';
import FileValidator from '../src/validators/FileValidator';

const fetchOk = async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) {
        throw new Error(`The request "${input}" returned with an HTTP status code: ${response.status}.`);
    }
    return response;
}

const setFieldError = (fieldElement, error) => {
    fieldElement.insertAdjacentHTML(
        'afterend',
        `<div class="error">${error}</div>`,
    );
}

const clearFieldErrors = (fieldElement) => {
    fieldElement.parentNode.querySelectorAll('.error').forEach(e => e.remove());
};

const setFormError = (formElement, error) => {
    const submitButton = formElement.querySelector(['button[type="submit"]']);
    submitButton.insertAdjacentHTML(
        'beforebegin',
        `<div class="form-error">${error}<br /><br /></div>`,
    );
}

const clearFormErrors = (formElement) => {
    formElement.querySelectorAll('.form-error').forEach(e => e.remove());
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
        console.log(formData);
        // here can be AJAX-request
        return new SubmissionResult(true);
    },
);

form.listen();

const domainField = new Field('.js-domain', '.js-container', ['required', 'isFQDN', async (value) => {
    const response = await fetchOk(`/check-domain?domain=${encodeURIComponent(value)}`);
    const result = await response.json();

    return ValidationResult.make(result.isValid, 'The domain must be in the .com zone.');
}], {
    invalidMessages: {
        required: 'Domain is required.',
        isFQDN: 'Domain is not valid.',
    },
    validateOnType: true,
    onTypingStart: (_, fieldElement) => {
        clearFieldErrors(fieldElement);
    },
    onAfterValidate: (validationResult, fieldElement) => {
        clearFieldErrors(fieldElement);
        if (!validationResult.isValid()) {
            setFieldError(fieldElement, validationResult.getMessage());
        }
    },
});

domainField.listen();

const mapResponseTypeToUrl = (value) => {
    if (value === 'positive') {
        return '/positive-response';
    }

    if (value === 'negative') {
        return '/negative-response';
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
                const response = await fetchOk(`/check-login?login=${encodeURIComponent(value)}`);
                const result = await response.json();

                return ValidationResult.make(result.isValid);
            },
        ]),
        new Field('.js-password', '.js-register-form', ['required']),
        new Field('.js-confirm-password', '.js-register-form', [
            'required',
            (value) => {
                const password = document.querySelector('.js-password').value;

                return ValidationResult.make(value === password);
            },
        ], {
            validationCacheEnabled: false,
        }),
    ],
    async (formData) => {
        const data = {
            login: formData.get('login'),
            password: formData.get('password'),
        };

        const url = mapResponseTypeToUrl(formData.get('response'));

        const response = await fetchOk(url, {
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
    [new Field('.js-email', '.js-email-list-form', ['required', 'isEmail', () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(ValidationResult.valid());
            }, 2000)
        })
    }])],
    (formData) => {
        // eslint-disable-next-line no-console
        console.log(formData);
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
                onChange: (_, fieldElement) => {
                    clearFieldErrors(fieldElement);
                },
                onAfterValidate: (validationResult, fieldElement) => {
                    clearFieldErrors(fieldElement);
                    if (!validationResult.isValid()) {
                        setFieldError(fieldElement, validationResult.getMessage());
                    }
                },
            },
        ),
    ],
    async () => {
        // eslint-disable-next-line no-console
        console.log(formData);
        return new SubmissionResult(true);
    },
);

uploadForm.listen();

const addressForm = new Form('.js-address-form', [
    new Field('.js-zip-code', '.js-address-form', [async (value) => {
        await fetchOk(`/check-zip-code?zip-code=${encodeURIComponent(value)}`);
        return ValidationResult.valid();
    }], {
        validateOnChange: true,
        onTypingStart: (_, fieldElement) => {
            clearFieldErrors(fieldElement);
        },
        onValidationError: (error, fieldElement) => {
            clearFieldErrors(fieldElement);
            setFieldError(fieldElement, error)
        },
    }),
    new Field('.js-address', '.js-address-form', ['required']),
], async (formData) => {
    const url = mapResponseTypeToUrl(formData.get('response'));

    const response = await fetchOk(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json();

    return new SubmissionResult(result.isSuccess);
}, {
    onBeforeValidate: (formElement) => {
        clearFormErrors(formElement);
    },
    onValidationError: (error, formElement) => {
        clearFormErrors(formElement);
        setFormError(formElement, error);
    },
    onSubmissionError: (error, formElement) => {
        clearFormErrors(formElement);
        setFormError(formElement, error);
    }
});

addressForm.listen();
