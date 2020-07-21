import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router';
import Home from "./Home";
import Dashboard from './Dashboard';
import History from './History';
import Player from "./Player";
import ChangeProfile from "./ChangeProfile";
import Training from "./Training";

Vue.config.productionTip = false
Vue.prototype.$websocket = new WebSocket("wss://localhost:6868");
Vue.prototype.$user = {
    'clientId': 'yxLBcYns3MkIe2vYg9yYUQkiPdekPAvzymsO0rlq',
    'clientSecret': '59ajJfvMrYNih1pZXCoB11U8tBGZdS5NRfR8NJeqTGJQ1te2cpEpoPNns4OMTjihsmT6Jt3qcuVq257TEZei76yw1Gk01nn0qXCVsRk9GlhOg96j9JAk36IakYbf9HqX'
}

Vue.use(VueRouter);

const routes = [
    {path: '/', component: Home},
    {path: '/dashboard', component: Dashboard},
    {path: '/history', component: History},
    {path: '/player', component: Player},
    {path: '/change-profile', component: ChangeProfile},
    {path: '/training/:action/', component: Training}

]

const router = new VueRouter({
    routes: routes,
    // disable /#/ when routing
    mode: 'history'
})

new Vue({
    render: h => h(App),
    router,
}).$mount('#app')
