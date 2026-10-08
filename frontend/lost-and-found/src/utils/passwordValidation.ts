// Defines the structure of password requirements
export interface PasswordRequirements {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

// Validates the password against the defined requirements
export function validatePassword(password: string): PasswordRequirements {
    return {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

// Checks if all password requirements are met
export function isPasswordValid(req:PasswordRequirements): boolean {
    // Check if all requirements are met
    return Object.values(req).every(value => value === true);
}