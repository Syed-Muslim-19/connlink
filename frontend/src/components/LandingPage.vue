<template>
  <div id="app">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg fixed w-full top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-800">ConnLink</h1>
          </div>

          <!-- Desktop Menu -->
          <div class="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              class="text-gray-600 hover:text-gray-900 transition duration-300"
              >Features</a
            >
            <a
              href="#pricing"
              class="text-gray-600 hover:text-gray-900 transition duration-300"
              >Pricing</a
            >
            <a
              href="#about"
              class="text-gray-600 hover:text-gray-900 transition duration-300"
              >About</a
            >
            <div class="flex space-x-4">
              <router-link
                to="/login"
                class="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Login
              </router-link>
              <router-link
                to="/signup"
                class="px-6 py-2 text-white gradient-btn rounded-lg transition duration-300 transform hover:scale-105"
              >
                Sign Up
              </router-link>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button @click="toggleMobileMenu" class="text-gray-600">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div v-show="mobileMenuOpen" class="md:hidden bg-white border-t">
          <div class="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#features"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-600"
              >Features</a
            >
            <a
              href="#pricing"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-600"
              >Pricing</a
            >
            <a
              href="#about"
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-600"
              >About</a
            >
            <div class="px-3 py-2 space-y-2">
              <router-link
                to="/login"
                @click="closeMobileMenu"
                class="block w-full px-6 py-2 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Login
              </router-link>
              <router-link
                to="/signup"
                @click="closeMobileMenu"
                class="block w-full px-6 py-2 text-center text-white gradient-btn rounded-lg transition duration-300"
              >
                Sign Up
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section
      class="pt-32 pb-32 hero-gradient text-white min-h-screen flex items-center"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <div class="mb-8">
            <span
              class="inline-block px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 mb-6 animate-pulse"
            >
              🚀 Now in Beta - Join Early!
            </span>
          </div>
          <h1 class="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
            Connect, Share,
            <span class="text-yellow-300 animate-bounce inline-block"
              >Subscribe</span
            >
          </h1>
          <p
            class="text-xl md:text-3xl mb-12 text-gray-200 max-w-4xl mx-auto leading-relaxed"
          >
            Join ConnLink - the modern social platform that combines
            <span class="text-yellow-300 font-semibold"
              >real-time messaging</span
            >
            with
            <span class="text-yellow-300 font-semibold"
              >premium creator features</span
            >. Build meaningful connections and unlock exclusive content.
          </p>
          <div class="flex flex-col sm:flex-row gap-6 justify-center">
            <router-link
              to="/signup"
              class="px-10 py-5 bg-white text-gray-800 rounded-xl font-bold text-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            >
              Get Started Free
            </router-link>
            <button
              @click="scrollToAbout"
              class="px-10 py-5 border-3 border-white text-white rounded-xl font-bold text-xl hover:bg-white hover:text-gray-800 transition duration-300 backdrop-blur-sm"
            >
              Learn More
            </button>
          </div>
          <div class="mt-16">
            <p class="text-sm text-gray-300 mb-4">
              Trusted by creators worldwide
            </p>
            <div class="flex justify-center items-center space-x-8 opacity-70">
              <div class="text-center">
                <div class="text-2xl font-bold">
                  {{ userCount.toLocaleString() }}+
                </div>
                <div class="text-xs">Active Users</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">500+</div>
                <div class="text-xs">Verified Creators</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">50K+</div>
                <div class="text-xs">Messages Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Everything You Need to Connect
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            ConnLink brings together the best of social networking with powerful
            premium features
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <!-- Feature Cards - Only showing first 3 -->
          <div
            v-for="feature in features.slice(0, 3)"
            :key="feature.id"
            class="bg-white p-10 rounded-2xl card-shadow feature-card cursor-pointer group"
            @click="selectFeature(feature.id)"
            :class="{
              'ring-4 ring-purple-500 ring-opacity-50 scale-105':
                selectedFeature === feature.id,
            }"
          >
            <div
              class="w-16 h-16 gradient-btn rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition duration-300"
            >
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="feature.icon"
                ></path>
              </svg>
            </div>
            <h3
              class="text-2xl font-bold text-gray-800 mb-6 group-hover:text-purple-600 transition duration-300"
            >
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 text-lg leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Choose Your Plan
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade when you're ready to unlock premium creator
            features
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Free Plan -->
          <div
            class="bg-white p-8 rounded-2xl card-shadow border-2 border-gray-200 hover:border-purple-300 transition duration-300"
          >
            <div class="text-center mb-8">
              <div
                class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-2">Free Plan</h3>
              <div class="text-5xl font-bold text-gray-800 mb-2">
                ${{ plans.free.price
                }}<span class="text-lg text-gray-600">/month</span>
              </div>
              <p class="text-gray-600 text-lg">{{ plans.free.description }}</p>
            </div>

            <ul class="space-y-4 mb-8">
              <li
                v-for="feature in plans.free.features"
                :key="feature"
                class="flex items-center"
              >
                <div
                  class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4"
                >
                  <svg
                    class="w-4 h-4 text-green-600"
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
                <span class="text-gray-700">{{ feature }}</span>
              </li>
            </ul>

            <div class="text-center">
              <router-link
                to="/signup"
                class="w-full inline-block px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
              >
                Get Started Free
              </router-link>
            </div>
          </div>

          <!-- Premium Plan -->
          <div
            class="bg-white p-8 rounded-2xl card-shadow border-2 border-transparent gradient-btn relative overflow-hidden payment"
          >
            <div class="absolute top-4 right-4 z-10">
              <span
                class="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                >Most Popular</span
              >
            </div>

            <div class="text-center mb-8 text-white relative z-10">
              <div
                class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold mb-2">Premium Plan</h3>
              <div class="text-5xl font-bold mb-2">
                ${{ plans.premium.price
                }}<span class="text-lg opacity-80">/month</span>
              </div>
              <p class="opacity-90 text-lg">{{ plans.premium.description }}</p>
            </div>

            <ul class="space-y-4 mb-8 text-white relative z-10">
              <li
                v-for="feature in plans.premium.features"
                :key="feature"
                class="flex items-center"
              >
                <div
                  class="w-6 h-6 bg-yellow-400 bg-opacity-30 rounded-full flex items-center justify-center mr-4"
                >
                  <svg
                    class="w-4 h-4 text-white"
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
                <span>{{ feature }}</span>
              </li>
            </ul>

            <div class="text-center relative z-10">
              <router-link
                to="/signup"
                class="w-full inline-block px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
              >
                Start Premium Trial
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Built with Modern Technology
            </h2>
            <p class="text-lg text-gray-600 mb-6">
              ConnLink is built using the powerful MEVN Stack (MongoDB,
              Express.js, Vue.js, Node.js) ensuring scalability, performance,
              and a seamless user experience.
            </p>
            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="tech in technologies"
                :key="tech.name"
                class="bg-white p-4 rounded-lg card-shadow hover:shadow-lg transition duration-300"
              >
                <h4 class="font-semibold text-gray-800 mb-2">
                  {{ tech.name }}
                </h4>
                <p class="text-sm text-gray-600">{{ tech.description }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl card-shadow p-10 lg:mt-12">
            <h3 class="text-2xl font-bold text-gray-800 mb-6">Why ConnLink?</h3>
            <ul class="space-y-4">
              <li
                v-for="(reason, index) in whyConnLink"
                :key="index"
                class="flex items-start"
              >
                <div
                  class="w-6 h-6 gradient-btn rounded-full flex items-center justify-center mr-4 mt-1"
                >
                  <span class="text-white text-sm">{{ index + 1 }}</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">
                    {{ reason.title }}
                  </h4>
                  <p class="text-gray-600">{{ reason.description }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 hero-gradient text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          Ready to Start Connecting?
        </h2>
        <p class="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
          Join {{ userCount.toLocaleString() }} users already connecting and
          sharing on ConnLink. Start your journey today!
        </p>
        <router-link
          to="/signup"
          class="inline-block px-8 py-4 bg-white text-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
        >
          Get Started Now
        </router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold mb-4">ConnLink</h3>
            <p class="text-gray-400">
              Connecting people through modern social networking with premium
              creator features.
            </p>
          </div>
          <div v-for="section in footerSections" :key="section.title">
            <h4 class="font-semibold mb-4">{{ section.title }}</h4>
            <ul class="space-y-2 text-gray-400">
              <li v-for="link in section.links" :key="link">
                <a href="#" class="hover:text-white transition duration-300">{{
                  link
                }}</a>
              </li>
            </ul>
          </div>
        </div>
        <div
          class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400"
        >
          <p>&copy; {{ currentYear }} ConnLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "ConnLinkLanding",
  data() {
    return {
      mobileMenuOpen: false,
      selectedFeature: null,
      userCount: 15847,
      currentYear: new Date().getFullYear(),
      features: [
        {
          id: 1,
          title: "Secure Authentication",
          description:
            "Advanced security with encrypted login/signup system and comprehensive profile management.",
          icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
        },
        {
          id: 2,
          title: "Real-Time Messaging",
          description:
            "Instant one-to-one chat functionality with real-time updates powered by Socket.IO technology.",
          icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
        },
        {
          id: 3,
          title: "Premium Creator Features",
          description:
            "Unlock exclusive creator tools with premium subscriptions including the coveted blue tick verification.",
          icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
        },
      ],
      plans: {
        free: {
          price: 0,
          description: "Perfect for getting started",
          features: [
            "Basic messaging features",
            "Profile creation",
            "Limited post creation",
            "Community access",
          ],
        },
        premium: {
          price: 9.99,
          description: "For creators and power users",
          features: [
            "Everything in Free",
            "Creator Blue Tick ✓",
            "Unlimited messaging",
            "Priority support",
            "Advanced analytics",
          ],
        },
      },
      technologies: [
        { name: "Frontend", description: "Vue.js & Tailwind CSS" },
        { name: "Backend", description: "Node.js & Express.js" },
        { name: "Database", description: "MongoDB" },
        { name: "Real-time", description: "Socket.IO" },
      ],
      whyConnLink: [
        {
          title: "Real-time Experience",
          description: "Instant messaging with Socket.IO technology",
        },
        {
          title: "Creator Economy",
          description: "Premium features designed for content creators",
        },
        {
          title: "Scalable Architecture",
          description: "Built for growth with modern web technologies",
        },
      ],
      footerSections: [
        {
          title: "Features",
          links: [
            "Real-time Messaging",
            "Premium Subscriptions",
            "Creator Tools",
            "Secure Authentication",
          ],
        },
        {
          title: "Company",
          links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"],
        },
        {
          title: "Support",
          links: ["Help Center", "Community", "API Documentation", "Status"],
        },
      ],
    };
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false;
    },
    selectFeature(featureId) {
      this.selectedFeature =
        this.selectedFeature === featureId ? null : featureId;
    },
    scrollToAbout() {
      document.getElementById("about").scrollIntoView({ behavior: "smooth" });
    },
  },
  mounted() {
    // Simulate user count updates
    setInterval(() => {
      this.userCount += Math.floor(Math.random() * 3);
    }, 5000);
  },
};
</script>

<style scoped>
.gradient-btn {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
}

.gradient-btn:hover {
  background: linear-gradient(135deg, #db2777 0%, #7c3aed 100%);
}

.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-shadow {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feature-card:hover {
  transform: translateY(-5px);
  transition: all 0.3s ease;
}

.feature-card {
  transition: all 0.3s ease;
}
</style>
