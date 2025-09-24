<!-- Example of how to use Pinia stores in your Post component -->
<script setup>
import { ref, onMounted } from "vue";
import CommentDialog from "./CommentDialog.vue";
import { usePosts, useAuth } from "../composables/useStores";

// Use the stores
const { likePost, addComment } = usePosts();
const { currentUser } = useAuth();

// Modal state
const showModal = ref(false);
const showCommentDialog = ref(false);

// Comment input text
const text = ref("");

// Post data (this would come from props in a real implementation)
const postData = ref({
  _id: "1",
  username: "john_doe",
  avatar: "",
  imageUrl:
    "https://images.pexels.com/photos/13397143/pexels-photo-13397143.jpeg",
  likes: 124,
  isLiked: false,
  isBookmarked: false,
  comments: [],
});

// Functions
const toggleModal = () => {
  showModal.value = !showModal.value;
};

const closeModal = () => {
  showModal.value = false;
};

const openCommentDialog = () => {
  showCommentDialog.value = true;
};

const closeCommentDialog = () => {
  showCommentDialog.value = false;
};

const handleUnfollow = () => {
  console.log("Unfollow action");
  closeModal();
};

const handleAddToFavorite = () => {
  console.log("Add to favorite action");
  closeModal();
};

const handleDelete = () => {
  console.log("Delete action");
  closeModal();
};

// Use Pinia store for like functionality
const toggleLike = async () => {
  try {
    await likePost(postData.value._id);
    // The store will automatically update the post data
  } catch (error) {
    console.error("Error liking post:", error);
  }
};

const toggleBookmark = () => {
  postData.value.isBookmarked = !postData.value.isBookmarked;
};

// Use Pinia store for adding comments
const addCommentToPost = async () => {
  if (text.value.trim().length > 0) {
    try {
      const comment = await addComment(postData.value._id, text.value);
      if (comment) {
        text.value = "";
        console.log("Comment added:", comment);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }
};

const handleCommentAdded = (comment) => {
  console.log("Comment added:", comment);
};
</script>

<!-- 
Usage example in your components:

1. Import the composables:
import { usePosts, useAuth, useUser } from '../composables/useStores'

2. Use them in your component:
const { fetchPosts, likePost, createPost } = usePosts()
const { isAuthenticated, login, logout } = useAuth()
const { fetchUserProfile, followUser } = useUser()

3. Access reactive state:
const posts = usePosts().posts
const user = useAuth().user
const isLoading = usePosts().isLoading

4. Call actions:
await fetchPosts()
await likePost(postId)
await login({ email, password })
-->
