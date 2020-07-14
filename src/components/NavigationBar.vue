<template>
    <div class="navigation-bar">
        <ul id="profile-card">
            <li>{{profileName}}</li>
        </ul>
        <div id="top-navigation">
                <router-link to="/dashboard" class="static" v-bind:class="{active: path === '/dashboard'}">
                    <span class="material-icons">dashboard</span>
                    Dashboard
                </router-link>
                <router-link to="/change-profile" class="static" v-bind:class="{active: path === '/change-profile'}">
                    <span class="material-icons">supervised_user_circle</span>
                    Change Profile
                </router-link>
                <router-link to="/history" class="static" v-bind:class="{active: path === '/history'}">
                    <span class="material-icons">history</span>
                    Show Recordings History
                </router-link>
        </div>
    </div>
</template>

<script>
    export default {
        name: "NavigationBar",
        data() {
            return {
                matchedPath: false,
                path: this.$route.path,
                profileName: sessionStorage.getItem('profile')
            }
        },
    }
</script>

<style scoped>
    ul {
        margin: 0;
    }

    li {
        margin: 0;
        width: 80%;
        background-color: #2BE4AD;
        cursor: default;
    }

    .navigation-bar {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-row-gap: 10px;
        margin-left: 40px;
    }

    .navigation-bar a {
        margin: 10px;
        font-size: 14px;
    }

    #profile-card {
        grid-column: 1 / 2;
    }

    #top-navigation {
        grid-column: 2 / f;
        justify-self: left;
        align-self: center;
        margin-left: 10px;
        display: inline-block;
    }

    .material-icons {
        vertical-align: middle;
    }

    .active {
        color: #2BE4AD;
    }
</style>
