<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border mb-6">
        <div class="px-6 py-4 border-b">
          <h1 class="text-xl font-semibold text-gray-900">Edit Profile</h1>
        </div>

        <!-- Form Content -->
        <div class="p-6">
          <form @submit.prevent="editProfileHandler" class="space-y-6">
            <!-- Profile Picture Section -->
            <div class="flex items-center space-x-6">
              <!-- Current Profile Picture -->
              <div class="flex-shrink-0">
                <div
                  v-if="!user.profilePicture"
                  class="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                >
                  <span class="text-white font-bold text-2xl">
                    {{ (user.username || "U").charAt(0).toUpperCase() }}
                  </span>
                </div>
                <img
                  v-else
                  :src="user.profilePicture"
                  :alt="user.username"
                  class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              </div>

              <!-- Profile Picture Controls -->
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ user.username }}
                </h3>
                <input
                  ref="imageRef"
                  type="file"
                  accept="image/*"
                  @change="handleImageChange"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.imageRef.click()"
                  class="mt-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                >
                  Change Photo
                </button>
              </div>
            </div>

            <!-- Username Display (Read-only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div
                class="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              >
                {{ user.username }}
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Your username cannot be changed
              </p>
            </div>

            <!-- Bio -->
            <div>
              <label
                for="bio"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                v-model="input.bio"
                rows="4"
                maxlength="150"
                placeholder="Write a bio..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                {{ input.bio ? input.bio.length : 0 }}/150 characters
              </p>
            </div>

            <!-- Gender -->
            <div>
              <label
                for="gender"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Gender
              </label>
              <select
                id="gender"
                v-model="input.gender"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-4">
              <button
                type="submit"
                :disabled="isLoading"
                class="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Updating...
                </span>
                <span v-else>Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import axios from "axios";
import { toast } from "vue3-toastify";

// Router and auth
const router = useRouter();
const authStore = useAuthStore();

// Refs
const imageRef = ref(null);
const isLoading = ref(false);

// Get user from auth store
const user = authStore.currentUser || authStore.user || {};

// Input reactive object to store form data
const input = reactive({
  bio: user.bio || "",
  gender: user.gender || "",
  profilePicture: null,
});

// Handle image file selection
const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    input.profilePicture = file;
    console.log("🟡 Image selected:", file.name);
    toast.success("Image selected successfully");
  }
};

// Edit profile handler
const editProfileHandler = async () => {
  try {
    isLoading.value = true;

    // Create FormData object
    const formData = new FormData();

    // Append form fields to FormData
    if (input.bio !== user.bio) {
      formData.append("bio", input.bio);
    }

    if (input.gender !== user.gender) {
      formData.append("gender", input.gender);
    }

    if (input.profilePicture) {
      formData.append("profilePicture", input.profilePicture);
    }

    // Check if there are any changes to submit
    if (
      !formData.has("bio") &&
      !formData.has("gender") &&
      !formData.has("profilePicture")
    ) {
      toast.info("No changes to save");
      return;
    }

    console.log("🟡 Submitting profile changes...");

    // API call to update profile
    const res = await axios.post(
      "http://localhost:3000/api/v1/user/profile/edit",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    if (res.data.success) {
      console.log("🟢 Profile updated successfully:", res.data);
      toast.success("Profile updated successfully!");

      // Update the user in auth store with new data
      if (res.data.user) {
        authStore.user = res.data.user;
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
      }

      // Navigate back to profile
      router.push(`/profile/${user._id}`);
    }
  } catch (error) {
    console.error("🔴 Error updating profile:", error);
    const errorMessage =
      error.response?.data?.message || "Failed to update profile";
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// Initialize form with user data on mount
onMounted(() => {
  console.log("🟡 EditProfile mounted with user:", user);

  // Ensure we have user data
  if (!user._id) {
    toast.error("User data not found");
    router.push("/");
    return;
  }

  // Initialize form fields with current user data
  input.bio = user.bio || "";
  input.gender = user.gender || "";
});
</script>

<style scoped>
/* Custom styles if needed */
</style>
