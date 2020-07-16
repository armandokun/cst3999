<template>
<div class="changeProfile">
    <NavigationBar/>
    <Home/>
</div>
</template>

<script>
    import NavigationBar from "@/components/NavigationBar";
    import Home from "./Home";

    export default {
        name: "ChangeProfile",
        components: {NavigationBar, Home}
    }
</script>

<style scoped>

</style>
