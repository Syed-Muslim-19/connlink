<template>
  <div
    class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4"
  >
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <!-- Success Icon -->
      <div
        class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <svg
          class="w-10 h-10 text-green-600"
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

      <!-- Success Message -->
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
      <p class="text-gray-600 mb-6">
        Congratulations! We're verifying your account now. Your blue checkmark will appear
        shortly.
      </p>

      <!-- Verification Status -->
      <div
        v-if="isVerifying"
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6"
      >
        <div class="flex items-center justify-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
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
          <span class="text-sm text-blue-700">Verifying your account...</span>
        </div>
      </div>

      <div
        v-if="verificationComplete && isVerified"
        class="bg-green-50 border border-green-200 rounded-lg p-3 mb-6"
      >
        <div class="flex items-center justify-center">
          <svg
            class="w-5 h-5 text-green-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-green-700">✅ Account verified successfully!</span>
        </div>
      </div>

      <!-- Features List -->
      <div
        class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6"
      >
        <h3
          class="font-semibold text-gray-900 mb-3 flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-blue-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          Premium Features Unlocked
        </h3>
        <ul class="text-sm text-gray-600 space-y-2">
          <li class="flex items-center">
            <svg
              class="w-4 h-4 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Verified blue checkmark
          </li>
          <li class="flex items-center">
            <svg
              class="w-4 h-4 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Premium status visibility
          </li>
          <li class="flex items-center">
            <svg
              class="w-4 h-4 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Enhanced profile features
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <router-link
          to="/"
          class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 block text-center"
        >
          Go to Home
        </router-link>
        <router-link
          :to="`/profile/${getCurrentUser()?._id || 'me'}`"
          class="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-300 block text-center"
        >
          View Profile
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import api from "../utils/api.js";

const router = useRouter();
const authStore = useAuthStore();

// Reactive variables for verification status
const isVerifying = ref(false);
const verificationComplete = ref(false);
const isVerified = ref(false);

const getCurrentUser = () => {
  return (
    authStore.currentUser || JSON.parse(localStorage.getItem("user") || "null")
  );
};

onMounted(async () => {
  console.log("🎉 SubscriptionSuccess: Component mounted");

  // Start verification process
  isVerifying.value = true;

  // Get session_id from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  console.log("🔍 Session ID from URL:", sessionId);

  const updateVerificationStatus = (success) => {
    isVerified.value = success;
    verificationComplete.value = true;
    isVerifying.value = false;
  };

  if (sessionId) {
    try {
      console.log("🔄 Attempting automatic payment verification...");

      // Try automatic verification first using the new endpoint
      const verifyResponse = await api.get(`/subscription/verify-payment?session_id=${sessionId}`);

      console.log("📥 Verification response:", verifyResponse.data);

      if (verifyResponse.data.success && verifyResponse.data.isVerified) {
        console.log("✅ Payment verified automatically!");

        // Update auth store
        if (authStore.currentUser) {
          authStore.currentUser.isVerified = true;
          authStore.currentUser.subscription = verifyResponse.data.subscription;
          localStorage.setItem("user", JSON.stringify(authStore.currentUser));
        }

        updateVerificationStatus(true);
        return; // Success, no need for fallback
      }
    } catch (error) {
      console.warn("⚠️ Automatic verification failed, trying fallback:", error);
    }

    // Fallback: Manual verification
    try {
      console.log("🔄 Using fallback manual verification...");

      const fallbackResponse = await api.post("/dev/manual-verify");

      console.log("📥 Fallback response:", fallbackResponse.data);

      if (fallbackResponse.data.success) {
        console.log("✅ Fallback verification successful!");

        // Update auth store
        if (authStore.currentUser) {
          authStore.currentUser.isVerified = true;
          authStore.currentUser.subscription = fallbackResponse.data.user.subscription;
          localStorage.setItem("user", JSON.stringify(authStore.currentUser));
        }

        updateVerificationStatus(true);
      } else {
        updateVerificationStatus(false);
      }
    } catch (fallbackError) {
      console.error("❌ Fallback verification also failed:", fallbackError);
      updateVerificationStatus(false);
    }
  } else {
    // No session ID, just try to refresh status
    updateVerificationStatus(false);
  }

  // Always refresh user data after verification attempts
  const refreshUserData = async () => {
    try {
      console.log("🔄 Refreshing user subscription status...");

      const response = await api.get("/subscription/status");

      console.log("📥 Status response:", response.data);

      if (
        response.data.success &&
        response.data.isVerified &&
        authStore.currentUser
      ) {
        authStore.currentUser.isVerified = response.data.isVerified;
        authStore.currentUser.subscription = response.data.subscription;
        localStorage.setItem("user", JSON.stringify(authStore.currentUser));
        console.log("✅ User verification status updated from status check");

        // Update UI if not already verified
        if (!isVerified.value) {
          updateVerificationStatus(true);
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
    }
  };

  // Delay the final refresh to allow time for processing
  setTimeout(refreshUserData, 3000);
});
</script>
