<script setup>
import axios from "axios";
import { ref, reactive } from "vue";
import { toast } from "vue3-toastify";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useStores.js";

const router = useRouter();

// Use Pinia auth store
const {
  signup,
  isLoading: authLoading,
  error: authError,
  clearError,
} = useAuth();

// Form data matching backend user model
const formData = reactive({
  username: "",
  email: "",
  password: "",
});

// Form state
const showPassword = ref(false);
const errors = reactive({});

// Clear errors when switching modes or on input
const clearErrors = () => {
  clearError();
  Object.keys(errors).forEach((key) => delete errors[key]);
};

// Validation functions
const validateForm = () => {
  const formErrors = {};

  if (!formData.username.trim()) {
    formErrors.username = "Username is required";
  } else if (formData.username.length < 3) {
    formErrors.username = "Username must be at least 3 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    formErrors.username =
      "Username can only contain letters, numbers, and underscores";
  }

  if (!formData.email.trim()) {
    formErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    formErrors.email = "Please enter a valid email address";
  }

  if (!formData.password) {
    formErrors.password = "Password is required";
  } else if (formData.password.length < 6) {
    formErrors.password = "Password must be at least 6 characters";
  }

  return formErrors;
};

// Submit function using Pinia store
const signupHandler = async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Clear previous errors
  clearErrors();

  // Validate form
  const formErrors = validateForm();
  if (Object.keys(formErrors).length > 0) {
    Object.assign(errors, formErrors);
    return;
  }

  try {
    // Dispatch signup action to auth store (like Redux dispatch)
    const result = await signup({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      toast.success(
        result.message || "Account created successfully! Please log in."
      );

      // Reset form on success
      Object.keys(formData).forEach((key) => {
        formData[key] = "";
      });

      // Navigate to login page after successful signup
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    }
  } catch (error) {
    // Handle store errors
    console.error("Signup error:", error);
    toast.error(authError.value || "Signup failed");
  }
};

// Password strength indicator
const getPasswordStrength = () => {
  const password = formData.password;
  if (!password) return { strength: 0, text: "", color: "" };

  let strength = 0;
  if (password.length >= 6) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const levels = [
    { text: "Very Weak", color: "bg-red-500" },
    { text: "Weak", color: "bg-orange-500" },
    { text: "Fair", color: "bg-yellow-500" },
    { text: "Good", color: "bg-blue-500" },
    { text: "Strong", color: "bg-green-500" },
  ];

  return {
    strength: (strength / 5) * 100,
    text: levels[strength - 1]?.text || "Very Weak",
    color: levels[strength - 1]?.color || "bg-red-500",
  };
};
</script>

<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <!-- Background decorations (hidden on white background) -->
    <div class="absolute inset-0 overflow-hidden hidden">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 backdrop-blur-3xl"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-pink-500/10 backdrop-blur-3xl"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-yellow-400/5 backdrop-blur-3xl"
      ></div>
    </div>

    <!-- Main signup card -->
    <div class="relative w-full max-w-md">
      <!-- Signup form -->
      <div class="bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl">
        <div class="text-center mb-8 mt-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Signup</h2>
        </div>

        <form @submit="signupHandler" class="space-y-6">
          <!-- Username field -->
          <div>
            <label class="block text-gray-700 font-medium mb-2">Username</label>
            <div class="relative">
              <input
                v-model="formData.username"
                type="text"
                placeholder="Choose a unique username"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all duration-300"
                :class="{
                  'border-red-400 focus:border-red-400 focus:ring-red-400/50':
                    errors.username,
                }"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  v-if="formData.username && !errors.username"
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
            <p v-if="errors.username" class="text-red-300 text-sm mt-1">
              {{ errors.username }}
            </p>
          </div>

          <!-- Email field -->
          <div>
            <label class="block text-gray-700 font-medium mb-2"
              >Email Address</label
            >
            <div class="relative">
              <input
                v-model="formData.email"
                type="email"
                placeholder="your@email.com"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all duration-300"
                :class="{
                  'border-red-400 focus:border-red-400 focus:ring-red-400/50':
                    errors.email,
                }"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  v-if="formData.email && !errors.email"
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
            <p v-if="errors.email" class="text-red-300 text-sm mt-1">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password field -->
          <div>
            <label class="block text-gray-700 font-medium mb-2">Password</label>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a strong password"
                class="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all duration-300"
                :class="{
                  'border-red-400 focus:border-red-400 focus:ring-red-400/50':
                    errors.password,
                }"
              />
              <button
                @click="showPassword = !showPassword"
                type="button"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  v-if="showPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-red-300 text-sm mt-1">
              {{ errors.password }}
            </p>

            <!-- Password strength indicator -->
            <div v-if="formData.password" class="mt-2">
              <div
                class="flex items-center justify-between text-sm text-gray-600 mb-1"
              >
                <span>Password strength</span>
                <span>{{ getPasswordStrength().text }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1">
                <div
                  class="h-1 rounded-full transition-all duration-300"
                  :class="getPasswordStrength().color"
                  :style="{ width: getPasswordStrength().strength + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- General error message -->
          <div
            v-if="errors.general"
            class="mt-4 p-3 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm"
          >
            {{ errors.general }}
          </div>

          <!-- Submit button -->
          <div class="flex justify-center mt-8">
            <button
              :disabled="authLoading"
              type="submit"
              class="w-full px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <svg
                v-if="authLoading"
                class="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span v-if="!authLoading">Create Account</span>
              <span v-else>Creating Account...</span>
            </button>
          </div>
        </form>

        <!-- Login link -->
        <div class="text-center mt-6 pt-6 border-t border-gray-200">
          <p class="text-gray-600">
            Already have an account?
            <router-link
              to="/login"
              class="text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              Sign in here
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom focus states */
.focus\:ring-pink-400\/50:focus {
  --tw-ring-color: rgb(244 114 182 / 0.5);
}

.focus\:ring-red-400\/50:focus {
  --tw-ring-color: rgb(248 113 113 / 0.5);
}
</style>
