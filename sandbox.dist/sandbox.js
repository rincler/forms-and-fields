import Form from '../src/Form';
import Field from '../src/Field';
import SubmissionResult from '../src/SubmissionResult';
import ValidationResult from '../src/ValidationResult';

const form = new Form(
    '.js-form',
    [
        new Field('.js-email', ['required', 'isEmail'], {
            invalidMessages: {
                required: 'Email is required',
                isEmail: 'Invalid email',
            },
        }),
        new Field('.js-secret-word', ['equals'], {
            validatorParams: {
                equals: ['sun'],
            },
        }),
        new Field('.js-sex', ['required']),
        new Field('.js-agree', ['required']),
        new Field('.js-city', ['required']),
        new Field('.js-movie', ['required']),
        new Field('.js-file', ['required']),
    ],
    {
        onAfterFieldValidate: (validationResult) => {
            console.log(validationResult);
        },
        onChange: (value) => {
            console.log(value);
        },
        submit: (formData) => {
            console.log(formData);
            // here can be AJAX-request
            return new SubmissionResult(true);
        },
    }
);

form.listen();

const fqdnField = new Field('.js-fqdn', ['required', 'isFQDN'], {
    validateOnType: true,
});

fqdnField.listen();

const registerForm = new Form(
    '.js-register-form',
    [
        new Field('.js-login', [
            'required',
            async (value) => {
                const response = await fetch(`/check-login?login=${encodeURIComponent(value)}`);
                const result = await response.json();

                return new ValidationResult(result.isValid);
            },
        ]),
        new Field('.js-password', ['required']),
        new Field('.js-confirm-password', [
            'required',
            (value) => {
                const password = document.querySelector('.js-password').value;

                return new ValidationResult(value === password);
            },
        ]),
    ],
    {
        submit: async (formData) => {
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
    }
);

registerForm.listen();

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
