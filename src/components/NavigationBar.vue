<template>
    <div class="navigation-bar">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/change-profile">Change Profile</router-link>
        <router-link to="/history">Show Recordings History</router-link>
    </div>
</template>

<script>
    export default {
        name: "NavigationBar"
    }
</script>

<style scoped>
    .navigation-bar a {
        margin: 10px;
    }
</style>
