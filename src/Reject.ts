export class RejectError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ignoreRejects = async (fn: () => any): Promise<any> => {
    try {
        await fn();
    } catch (error) {
        if (!(error instanceof RejectError)) {
            throw error;
        }
    }
};

interface ObjWithActionId {
    actionId?: number;
}

export const startAction = (obj: ObjWithActionId): number => {
    if (!obj.actionId) {
        // eslint-disable-next-line no-param-reassign
        obj.actionId = 0;
    }

    // eslint-disable-next-line no-param-reassign
    obj.actionId++;

    return obj.actionId;
};

export const finishAction = (obj: ObjWithActionId, actionIdForCheck: number): void => {
    if (obj.actionId !== actionIdForCheck) {
        throw new RejectError(
            'The action was rejected because a newer instance of the same action had started.',
        );
    }
};
