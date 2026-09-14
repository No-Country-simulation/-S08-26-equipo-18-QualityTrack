function getEnvVariable(key: string, defaultValue: string = ''): string {
    const value = import.meta.env[key];
    return value || defaultValue;
}

export const ENV = {
    API_URL: getEnvVariable('VITE_API_URL', 'http://localhost:3000'),
}