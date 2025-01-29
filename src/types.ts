import ValidationResult from './ValidationResult';
import SubmissionResult from './SubmissionResult';

export type FieldValue = string | string[] | boolean | FileList | null;

export enum FieldStatus {
    No = '',
    Validating = 'ff-field-validating',
    Valid = 'ff-field-valid',
    Invalid = 'ff-field-invalid',
}

export interface FieldOptions {
    invalidMessages?: { [K in ValidatorName]?: string };
    defaultInvalidMessage?: string;
    trimEnabled?: boolean;
    typingDelay?: number;
    validateOnChange?: boolean;
    validateOnType?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validatorParams?: { [K in VendorValidatorName]?: any[] };
    validationCacheEnabled?: boolean;
    onChange?: (fieldValue: FieldValue, fieldElement: Element, containerElement: Element) => void;
    onTypingStart?: (fieldElement: Element, containerElement: Element) => void;
    onTypingEnd?: (
        fieldValue: FieldValue,
        fieldElement: Element,
        containerElement: Element,
    ) => void;
    onBeforeValidate?: (fieldElement: Element, containerElement: Element) => void;
    onAfterValidate?: (
        validationResult: ValidationResult,
        fieldElement: Element,
        containerElement: Element,
    ) => void;
    onValidationError?: (error: unknown, fieldElement: Element, containerElement: Element) => void;
    onResetStatus?: (
        fieldElement: Element,
        containerElement: Element,
        wrapperElement: Element | null,
    ) => void;
    setStatus?: (
        status: FieldStatus,
        fieldElement: Element,
        containerElement: Element,
        wrapperElement: Element | null,
    ) => void;
}

export type FieldOptionName = keyof FieldOptions;

export type VendorValidatorName =
    | 'contains'
    | 'equals'
    | 'isAbaRouting'
    | 'isAfter'
    | 'isAlphanumeric'
    | 'isAscii'
    | 'isBase32'
    | 'isBase58'
    | 'isBase64'
    | 'isBefore'
    | 'isBIC'
    | 'isBoolean'
    | 'isBtcAddress'
    | 'isByteLength'
    | 'isCreditCard'
    | 'isCurrency'
    | 'isDataURI'
    | 'isDate'
    | 'isDecimal'
    | 'isDivisibleBy'
    | 'isEAN'
    | 'isEmail'
    | 'isEmpty'
    | 'isEthereumAddress'
    | 'isFloat'
    | 'isFQDN'
    | 'isFreightContainerID'
    | 'isFullWidth'
    | 'isHalfWidth'
    | 'isHash'
    | 'isHexadecimal'
    | 'isHexColor'
    | 'isHSL'
    | 'isIBAN'
    | 'isIdentityCard'
    | 'isIMEI'
    | 'isIn'
    | 'isInt'
    | 'isIP'
    | 'isIPRange'
    | 'isISBN'
    | 'isISIN'
    | 'isISO6346'
    | 'isISO6391'
    | 'isISO8601'
    | 'isISO31661Alpha2'
    | 'isISO31661Alpha3'
    | 'isISO4217'
    | 'isISRC'
    | 'isISSN'
    | 'isJSON'
    | 'isJWT'
    | 'isLatLong'
    | 'isLength'
    | 'isLicensePlate'
    | 'isLocale'
    | 'isLowercase'
    | 'isLuhnNumber'
    | 'isMACAddress'
    | 'isMagnetURI'
    | 'isMailtoURI'
    | 'isMD5'
    | 'isMimeType'
    | 'isMobilePhone'
    | 'isMongoId'
    | 'isMultibyte'
    | 'isNumeric'
    | 'isOctal'
    | 'isPassportNumber'
    | 'isPort'
    | 'isPostalCode'
    | 'isRFC3339'
    | 'isRgbColor'
    | 'isSemVer'
    | 'isSurrogatePair'
    | 'isUppercase'
    | 'isSlug'
    | 'isStrongPassword'
    | 'isTime'
    | 'isTaxID'
    | 'isURL'
    | 'isUUID'
    | 'isVariableWidth'
    | 'isVAT'
    | 'isWhitelisted'
    | 'matches';

export type ValidatorName = 'required' | VendorValidatorName;
export type ValidateFn = (value: FieldValue) => ValidationResult | Promise<ValidationResult>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VendorValidateFn = (...params: any[]) => boolean;
export type Validator = ValidatorName | ValidateFn | { validate: ValidateFn };
export type ValueableElement = HTMLInputElement | HTMLTextAreaElement | HTMLOptionElement;

export enum FormStatus {
    No = '',
    Validating = 'ff-form-validating',
    Valid = 'ff-form-valid',
    Invalid = 'ff-form-invalid',
    Submitting = 'ff-form-submitting',
    PositiveSubmit = 'ff-form-positive-submit',
    NegativeSubmit = 'ff-form-negative-submit',
}

export type FormOptions = FieldOptions & {
    onBeforeValidate?: (formElement: Element) => void;
    validate?: (formData: FormData) => ValidationResult | Promise<ValidationResult>;
    onAfterValidate?: (validationResults: ValidationResult[], formElement: Element) => void;
    onValidationError?: (error: unknown, formElement: Element) => void;
    onBeforeSubmit?: (formData: FormData, formElement: Element) => void;
    onAfterSubmit?: (submissionResult: SubmissionResult, formElement: Element) => void;
    onAfterPositiveSubmit?: (data: object, formElement: Element) => void;
    onAfterNegativeSubmit?: (data: object, formElement: Element) => void;
    onSubmissionError?: (error: unknown, formElement: Element) => void;
    onResetStatus?: (formElement: Element) => void;
    setStatus?: (status: FormStatus, formElement: Element) => void;
    onBeforeValidateField?: FieldOptions['onBeforeValidate'];
    onAfterValidateField?: FieldOptions['onAfterValidate'];
    onFieldValidationError?: FieldOptions['onValidationError'];
    onResetFieldStatus?: FieldOptions['onResetStatus'];
    setFieldStatus?: FieldOptions['setStatus'];
};

export type FormOptionName = keyof FormOptions;

export type SubmitFn = (formData: FormData) => SubmissionResult | Promise<SubmissionResult>;

export interface FileValidatorRules {
    maxCount?: number;
    maxSize?: number;
    allowedExtensions?: string[];
    allowedMimeTypes?: string[];
}

export type FileValidatorInvalidMessages = { [K in keyof FileValidatorRules]: string };
