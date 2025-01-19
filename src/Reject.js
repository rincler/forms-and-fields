export class RejectError extends Error {}

export const ignoreRejects = async (fn) => {
    try {
        await fn();
    } catch (error) {
        if (!(error instanceof RejectError)) {
            throw error;
        }
    }
};

export const startAction = (obj) => {
    if (!obj.actionId) {
        // eslint-disable-next-line no-param-reassign
        obj.actionId = 0;
    }

    // eslint-disable-next-line no-param-reassign
    obj.actionId++;

    return obj.actionId;
};

export const finishAction = (obj, actionIdForCheck) => {
    if (obj.actionId !== actionIdForCheck) {
        throw new RejectError(
            'The action was rejected because a newer instance of the same action had started.',
        );
    }
};
