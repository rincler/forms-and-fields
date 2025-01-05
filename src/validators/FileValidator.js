import ValidationResult from '../ValidationResult';

export default class FileValidator {
    /**
     * @public
     *
     * @param {object} rules
     * @param {object} invalidMessages
     */
    constructor(rules, invalidMessages = {}) {
        this.rules = rules;
        this.invalidMessages = invalidMessages;

        this.invalidMessages.maxCount = this.invalidMessages.maxCount || 'Invalid count.';

        const defaultInvalidMessage = '{file} is invalid.';
        this.invalidMessages.allowedMimes = this.invalidMessages.allowedMimes || defaultInvalidMessage;
        this.invalidMessages.allowedExtensions = this.invalidMessages.allowedExtensions || defaultInvalidMessage;
        this.invalidMessages.maxSize = this.invalidMessages.maxSize || defaultInvalidMessage;
    }

    /**
     *
     * @param {FileList} files
     *
     * @return ValidationResult
     */
    validate(files) {
        if (this.rules.maxCount && files.length > this.rules.maxCount) {
            return new ValidationResult(false, this.prepareMessage(this.invalidMessages.maxCount));
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            if (this.rules.allowedMimes && !this.rules.allowedMimes.includes(file.type)) {
                return new ValidationResult(false, this.prepareMessage(this.invalidMessages.allowedMimes, file));
            }

            if (this.rules.allowedExtensions) {
                if (!this.rules.allowedExtensions.some((e) => file.name.endsWith(e))) {
                    return new ValidationResult(
                        false,
                        this.prepareMessage(this.invalidMessages.allowedExtensions, file)
                    );
                }
            }

            if (this.rules.maxSize && file.size > this.rules.maxSize) {
                return new ValidationResult(false, this.prepareMessage(this.invalidMessages.maxSize, file));
            }
        }

        return new ValidationResult(true);
    }

    prepareMessage(message, file = undefined) {
        let preparedMessage = message;

        if (this.rules.maxCount) {
            preparedMessage = preparedMessage.replace('{maxCount}', this.rules.maxCount);
        }

        if (!file) {
            return preparedMessage;
        }

        preparedMessage = message.replace('{file}', file.name);

        if (this.rules.allowedMimes) {
            preparedMessage = preparedMessage.replace('{fileMimeType}', file.type || 'unknown');
            preparedMessage = preparedMessage.replace('{allowedMimes}', this.rules.allowedMimes.join(', '));
        }

        if (this.rules.allowedExtensions) {
            preparedMessage = preparedMessage.replace('{allowedExtensions}', this.rules.allowedExtensions.join(', '));
        }

        if (this.rules.maxSize) {
            const round = (v) => Math.round(v * 100) / 100;
            preparedMessage = preparedMessage.replace('{fileSize}', file.size);
            preparedMessage = preparedMessage.replace('{fileSizeInKib}', round(file.size / 1024));
            preparedMessage = preparedMessage.replace('{fileSizeInMiB}', round(file.size / 1024 / 1024));
            preparedMessage = preparedMessage.replace('{fileSizeInGiB}', round(file.size / 1024 / 1024 / 1024));
            preparedMessage = preparedMessage.replace('{maxSize}', this.rules.maxSize);
            preparedMessage = preparedMessage.replace('{maxSizeInKiB}', round(this.rules.maxSize / 1024));
            preparedMessage = preparedMessage.replace('{maxSizeInMiB}', round(this.rules.maxSize / 1024 / 1024));
            preparedMessage = preparedMessage.replace('{maxSizeInGiB}', round(this.rules.maxSize / 1024 / 1024 / 1024));
        }

        return preparedMessage;
    }
}
