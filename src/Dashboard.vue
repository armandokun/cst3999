<template>
    <div class="dashboard">
        <h1>DASHBOARD</h1>
        <hr>
        <NavigationBar/>
    </div>
</template>

<script>
    import NavigationBar from "@/components/NavigationBar";

    export default {
        name: "Dashboard",
        components: {NavigationBar: NavigationBar},
    }
</script>

<style scoped>
    .dashboard {
        margin: 10px;
    }
</style>
