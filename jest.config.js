export default {
    testEnvironment: 'jsdom',
    transform: {
        '\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    sourceMap: true,
                },
            },
        ],
    },
};
