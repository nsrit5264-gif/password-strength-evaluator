document.addEventListener('DOMContentLoaded', () => {
    // Existing DOM elements
    const passwordInput = document.getElementById('passwordInput');
    const togglePassword = document.getElementById('togglePassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthScore = document.getElementById('strengthScore');
    const strengthLabel = document.getElementById('strengthLabel');
    const requirementsList = document.querySelectorAll('.requirements-list li');
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const strengthInfo = document.querySelector('.strength-info');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    const suggestionsList = document.getElementById('suggestionsList');

    // Theme Management
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    const toggleTheme = () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.setAttribute('aria-label', `Switch to ${currentTheme} mode`);
    };

    themeToggle.addEventListener('click', toggleTheme);

    // Password visibility toggle
    const togglePasswordVisibility = () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.setAttribute('aria-pressed', type === 'text');
        togglePassword.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    };

    togglePassword.addEventListener('click', togglePasswordVisibility);

    // Password strength levels
    const strengthLevels = {
        'very-weak': { color: 'var(--danger)', label: 'Very Weak' },
        'weak': { color: 'var(--warning)', label: 'Weak' },
        'medium': { color: 'var(--primary)', label: 'Medium' },
        'strong': { color: 'var(--success)', label: 'Strong' },
        'very-strong': { color: '#059669', label: 'Very Strong' }
    };

    // Password requirements
    const requirements = {
        length: { regex: /.{8,}/, message: 'At least 8 characters' },
        uppercase: { regex: /[A-Z]/, message: 'At least 1 uppercase letter' },
        lowercase: { regex: /[a-z]/, message: 'At least 1 lowercase letter' },
        number: { regex: /[0-9]/, message: 'At least 1 number' },
        special: { regex: /[^A-Za-z0-9]/, message: 'At least 1 special character' }
    };

    // Password generation helpers
    const getRandomChar = (chars) => chars[Math.floor(Math.random() * chars.length)];

    const generateSuggestion = (basePassword, strength) => {
        const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
        const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let suggestion = basePassword;
        const minLength = Math.max(12, basePassword.length);
        const targetLength = strength === 'very-weak' || strength === 'weak' 
            ? Math.max(minLength, 14)
            : Math.max(minLength, basePassword.length + 3);

        // Ensure minimum length
        while (suggestion.length < targetLength) {
            const charsToAdd = [
                getRandomChar(lowerChars),
                getRandomChar(upperChars),
                getRandomChar(numbers),
                getRandomChar(specials)
            ];
            suggestion += charsToAdd[Math.floor(Math.random() * charsToAdd.length)];
        }

        // Ensure all required character types
        const missingRequirements = Object.entries(requirements)
            .filter(([key, { regex }]) => !regex.test(suggestion))
            .map(([key]) => key);

        for (const req of missingRequirements) {
            switch (req) {
                case 'uppercase':
                    suggestion = getRandomChar(upperChars) + suggestion.slice(1);
                    break;
                case 'lowercase':
                    suggestion = suggestion.slice(0, -1) + getRandomChar(lowerChars);
                    break;
                case 'number':
                    const insertPos = Math.floor(suggestion.length / 2);
                    suggestion = suggestion.slice(0, insertPos) + 
                               getRandomChar(numbers) + 
                               suggestion.slice(insertPos);
                    break;
                case 'special':
                    suggestion = suggestion.replace(/[a-zA-Z]/, getRandomChar(specials));
                    break;
            }
        }

        // Add some randomness
        if (Math.random() > 0.7) {
            const chars = suggestion.split('');
            for (let i = 0; i < Math.ceil(chars.length / 4); i++) {
                const pos = Math.floor(Math.random() * chars.length);
                chars[pos] = getRandomChar(upperChars + lowerChars + numbers + specials);
            }
            suggestion = chars.join('');
        }

        return suggestion;
    };

    const generateSuggestions = (basePassword, strength, count = 3) => {
        const suggestions = new Set();
        
        // Generate unique suggestions
        while (suggestions.size < count) {
            const suggestion = generateSuggestion(basePassword, strength);
            if (suggestion !== basePassword) {
                suggestions.add(suggestion);
            }
        }

        return Array.from(suggestions);
    };

    // Update suggestions in the UI
    const updateSuggestions = (suggestions) => {
        if (!suggestions || suggestions.length === 0) {
            suggestionsContainer.hidden = true;
            return;
        }

        suggestionsList.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            
            const span = document.createElement('span');
            span.className = 'suggestion-text';
            span.textContent = suggestion;
            
            const button = document.createElement('button');
            button.className = 'suggestion-copy';
            button.setAttribute('aria-label', `Copy password suggestion: ${suggestion}`);
            button.innerHTML = '📋';
            
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(suggestion).then(() => {
                    button.textContent = '✓';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = '📋';
                        button.classList.remove('copied');
                    }, 2000);
                });
            });
            
            li.appendChild(span);
            li.appendChild(button);
            suggestionsList.appendChild(li);
        });

        suggestionsContainer.hidden = false;
    };

    // Check password against requirements
    const checkPassword = (password) => {
        const result = {
            score: 0,
            strength: 'very-weak',
            requirements: {}
        };

        // Check each requirement
        Object.entries(requirements).forEach(([key, { regex }]) => {
            const isValid = regex.test(password);
            result.requirements[key] = isValid;
            
            if (isValid) {
                result.score += 20; // Each requirement is worth 20 points
            }
        });

        // Determine strength level
        if (result.score >= 80) {
            result.strength = 'very-strong';
        } else if (result.score >= 60) {
            result.strength = 'strong';
        } else if (result.score >= 40) {
            result.strength = 'medium';
        } else if (result.score >= 20) {
            result.strength = 'weak';
        } else {
            result.strength = 'very-weak';
        }

        // Bonus for longer passwords
        if (password.length >= 12) {
            result.score = Math.min(100, result.score + 10);
            if (result.strength !== 'very-strong') {
                result.strength = result.score >= 80 ? 'very-strong' : 'strong';
            }
        } else if (password.length >= 16) {
            result.score = 100;
            result.strength = 'very-strong';
        }

        return result;
    };

    // Update requirement indicators
    const updateRequirements = (requirements) => {
        requirementsList.forEach(item => {
            const requirement = item.getAttribute('data-requirement');
            if (requirements[requirement]) {
                item.classList.add('valid');
            } else {
                item.classList.remove('valid');
            }
        });
    };

    // Update UI based on password strength
    const updateUI = (result) => {
        try {
            const { score, strength, requirements } = result;
            const { color, label } = strengthLevels[strength] || strengthLevels['very-weak'];

            // Show strength info with animation
            strengthInfo.classList.add('visible');

            // Update strength meter with smooth transitions
            requestAnimationFrame(() => {
                strengthBar.style.width = `${score}%`;
                strengthBar.style.backgroundColor = color;
                strengthBar.className = 'strength-bar';
                strengthBar.classList.add(`strength-${strength}`);
                strengthBar.setAttribute('aria-valuenow', score);
            });

            // Update score and label
            strengthScore.textContent = `${score}%`;
            strengthLabel.textContent = label;
            strengthLabel.style.color = color;

            // Update requirement indicators
            updateRequirements(requirements);

            // Generate and show suggestions if password is not empty
            if (passwordInput.value.trim().length > 0) {
                const suggestions = generateSuggestions(passwordInput.value, strength, 3);
                updateSuggestions(suggestions);
            } else {
                suggestionsContainer.hidden = true;
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            resetUI();
        }
    };

    // Reset UI to initial state
    const resetUI = () => {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '';
        strengthBar.className = 'strength-bar';
        strengthBar.setAttribute('aria-valuenow', 0);
        strengthScore.textContent = '0%';
        strengthLabel.textContent = 'Very Weak';
        strengthLabel.style.color = '';
        strengthInfo.classList.remove('visible');
        suggestionsContainer.hidden = true;

        requirementsList.forEach(item => {
            item.classList.remove('valid');
        });
    };

    // Debounce function to limit how often the password is checked
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Check password strength on input
    const checkPasswordStrength = () => {
        const password = passwordInput.value.trim();
        
        if (password.length === 0) {
            resetUI();
            return;
        }

        const result = checkPassword(password);
        updateUI(result);
    };

    // Add event listener with debounce
    const debouncedCheck = debounce(checkPasswordStrength, 150);
    passwordInput.addEventListener('input', () => {
        requestAnimationFrame(debouncedCheck);
    });

    // Initialize
    resetUI();

    // Add keyboard accessibility for password toggle
    togglePassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility();
        }
    });

    // Add focus styles for better accessibility
    passwordInput.addEventListener('focus', () => {
        passwordInput.parentElement.classList.add('focused');
    });

    passwordInput.addEventListener('blur', () => {
        passwordInput.parentElement.classList.remove('focused');
    });

    // Handle touch devices
    document.addEventListener('touchstart', () => {}, { passive: true });
});