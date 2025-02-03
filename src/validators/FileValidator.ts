import ValidationResult from '../ValidationResult';
import { FieldValue, FileValidatorInvalidMessages, FileValidatorRules } from '../types';

export default class FileValidator {
    rules: FileValidatorRules;
    invalidMessages: Required<FileValidatorInvalidMessages>;

    constructor(rules: FileValidatorRules, invalidMessages: FileValidatorInvalidMessages = {}) {
        this.rules = rules;

        const defaultInvalidMessage = '{file} is invalid.';

        this.invalidMessages = {
            maxCount: invalidMessages.maxCount || 'Invalid count.',
            maxSize: invalidMessages.maxSize || defaultInvalidMessage,
            allowedExtensions: invalidMessages.allowedExtensions || defaultInvalidMessage,
            allowedMimeTypes: invalidMessages.allowedMimeTypes || defaultInvalidMessage,
        };
    }

    validate(files: FieldValue): ValidationResult {
        if (!(files instanceof FileList)) {
            throw new Error('Value is not an instance of the FileList class.');
        }

        if (this.rules.maxCount !== undefined && files.length > this.rules.maxCount) {
            return ValidationResult.invalid(this.prepareMessage(this.invalidMessages.maxCount));
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            if (this.rules.maxSize !== undefined && file.size > this.rules.maxSize) {
                return ValidationResult.invalid(
                    this.prepareMessage(this.invalidMessages.maxSize, file),
                );
            }

            if (
                this.rules.allowedExtensions !== undefined &&
                !this.rules.allowedExtensions.some((e) => file.name.endsWith(e))
            ) {
                return ValidationResult.invalid(
                    this.prepareMessage(this.invalidMessages.allowedExtensions, file),
                );
            }

            if (
                this.rules.allowedMimeTypes !== undefined &&
                !this.rules.allowedMimeTypes.includes(file.type)
            ) {
                return ValidationResult.invalid(
                    this.prepareMessage(this.invalidMessages.allowedMimeTypes, file),
                );
            }
        }

        return ValidationResult.valid();
    }

    prepareMessage(message: string, file: File | undefined = undefined): string {
        let preparedMessage = message;

        if (this.rules.maxCount) {
            preparedMessage = preparedMessage.replace('{maxCount}', this.rules.maxCount.toString());
        }

        if (file === undefined) {
            return preparedMessage;
        }

        preparedMessage = message.replace('{file}', file.name);

        if (this.rules.allowedMimeTypes) {
            preparedMessage = preparedMessage.replace('{fileMimeType}', file.type || 'unknown');
            preparedMessage = preparedMessage.replace(
                '{allowedMimeTypes}',
                this.rules.allowedMimeTypes.join(', '),
            );
        }

        if (this.rules.allowedExtensions) {
            preparedMessage = preparedMessage.replace(
                '{allowedExtensions}',
                this.rules.allowedExtensions.join(', '),
            );
        }

        if (this.rules.maxSize) {
            const round = (v: number): number => Math.round(v * 100) / 100;
            preparedMessage = preparedMessage.replace('{fileSize}', file.size.toString());
            preparedMessage = preparedMessage.replace(
                '{fileSizeInKib}',
                round(file.size / 1024).toString(),
            );
            preparedMessage = preparedMessage.replace(
                '{fileSizeInMiB}',
                round(file.size / 1024 / 1024).toString(),
            );
            preparedMessage = preparedMessage.replace(
                '{fileSizeInGiB}',
                round(file.size / 1024 / 1024 / 1024).toString(),
            );
            preparedMessage = preparedMessage.replace('{maxSize}', this.rules.maxSize.toString());
            preparedMessage = preparedMessage.replace(
                '{maxSizeInKiB}',
                round(this.rules.maxSize / 1024).toString(),
            );
            preparedMessage = preparedMessage.replace(
                '{maxSizeInMiB}',
                round(this.rules.maxSize / 1024 / 1024).toString(),
            );
            preparedMessage = preparedMessage.replace(
                '{maxSizeInGiB}',
                round(this.rules.maxSize / 1024 / 1024 / 1024).toString(),
            );
        }

        return preparedMessage;
    }
}
