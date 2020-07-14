<template>
    <div id="home">
        <div id="profiles">
            <label for="new-profile-name">
                <input type="text"
                       id="new-profile-name"
                       v-if="showInput"
                       v-model.trim="profileName"
                       placeholder="Enter New Profile Name">
            </label>
            <button class="primary-btn" @click="createProfile()">Create New Profile</button>
            <div v-bind:key="profile.id" v-for="profile in profiles">
                <ul>
                    <li v-bind:key="profile.name"
                        @click="loadProfile(profile.name)">
                        {{profile.name}}
                    </li>
                </ul>
            </div>
        </div>
        <!-- Sizing makes it vertical -->
        <hr width="1" size="500">
        <div id="guest-profile">
            <a @click="loadGuestProfile">Load Guest Profile</a>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Home',
        data() {
            return {
                profiles: [],
                showInput: false,
                profileName: ""
            }
        },
        methods: {
            queryProfiles: function (authToken) {
                const QUERY_PROFILE_ID = 3;
                let queryProfileRequest = {
                    'jsonrpc': '2.0',
                    'method': 'queryProfile',
                    'params': {
                        'cortexToken': authToken
                    },
                    'id': QUERY_PROFILE_ID
                };
                let ref = this;

                let message = JSON.stringify(queryProfileRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);


                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`);
                        try {
                            let parsedResult = JSON.parse(msgEvent.data);
                            if (parsedResult['id'] === QUERY_PROFILE_ID) {
                                resolve(parsedResult['result']);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };
                });
            },
            createProfile: async function () {
                if (this.showInput) {
                    let name = this.profileName;
                    let cortexToken = sessionStorage.getItem('cortexToken');
                    await this.setupProfile(name, cortexToken)
                        .then(message => {
                            let result = JSON.parse(message);
                            if ('error' in result) {
                                alert(result.error.message);
                            } else {
                                this.queryProfiles(sessionStorage.getItem('cortexToken'))
                                    .then(profiles => this.profiles = profiles);

                                // Hide input box
                                this.showInput = false;
                            }
                        });
                } else {
                    this.showInput = true;
                }
            },
            setupProfile: function (profileName, authToken) {
                const SETUP_PROFILE_ID = 5;
                let setupProfileRequest = {
                    'jsonrpc': '2.0',
                    'method': 'setupProfile',
                    'params': {
                        'cortexToken': authToken,
                        'profile': profileName,
                        'status': 'create'
                    },
                    'id': SETUP_PROFILE_ID
                };

                let ref = this;

                let message = JSON.stringify(setupProfileRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {

                        let parsedResult = JSON.parse(msgEvent.data);
                        console.log(`RESPONSE: ${parsedResult}`)

                        try {
                            if (parsedResult['id'] === SETUP_PROFILE_ID) {
                                resolve(msgEvent.data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            },
            loadProfile: function (profileName) {
                let authToken = sessionStorage.getItem('cortexToken');
                let headsetID = sessionStorage.getItem('headsetID');
                const LOAD_PROFILE_ID = 6;
                let loadProfileRequest = {
                    'jsonrpc': '2.0',
                    'method': 'setupProfile',
                    'params': {
                        'cortexToken': authToken,
                        'headset': headsetID,
                        'profile': profileName,
                        'status': 'load'
                    },
                    'id': LOAD_PROFILE_ID
                };

                let ref = this;

                let message = JSON.stringify(loadProfileRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === LOAD_PROFILE_ID) {
                                sessionStorage.setItem('profile', parsedResult.result.name);
                                ref.$router.push('/dashboard');
                                resolve(msgEvent.data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            },
            loadGuestProfile: function () {
                let authToken = sessionStorage.getItem('cortexToken');
                let headsetID = sessionStorage.getItem('headsetID');
                const LOAD_GUEST_PROFILE_ID = 7;
                let loadGuestProfileRequest = {
                    'jsonrpc': '2.0',
                    'method': 'loadGuestProfile',
                    'params': {
                        'cortexToken': authToken,
                        'headset': headsetID,
                    },
                    'id': LOAD_GUEST_PROFILE_ID
                };

                let ref = this;

                let message = JSON.stringify(loadGuestProfileRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === LOAD_GUEST_PROFILE_ID) {
                                sessionStorage.setItem('profile', parsedResult.result.name);
                                ref.$router.push('/dashboard');
                                resolve(msgEvent.data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            },
        },
        mounted() {
            let ref = this;
            let queryProfileInterval = setInterval(async () => {
                if (this.$websocket.bufferedAmount === 0) {
                    await ref.queryProfiles(sessionStorage.getItem('cortexToken'))
                        .then(profiles => ref.profiles = profiles);
                    clearInterval(queryProfileInterval);
                }
            }, 1000);
        }
    };
</script>

<style scoped>

    hr {
        grid-column: 3 / 4;
    }

    #home {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        margin-top: 60px;
    }

    #profiles {
        grid-column: 2 / 3;
        align-self: center;
    }

    #guest-profile {
        grid-column: 4 / 5;
        justify-self: center;
        align-self: center;
    }

    #guest-profile a {
        padding: 0 10px;
    }

    #manage-profiles-btn {
        /*to make space between Manage Profiles and Load Guest Profile*/
        margin-top: 10px;
    }

    #new-profile-name {
        background: rgba(0, 0, 0, .04);
        border: #2BE4AD 2px solid;
        border-radius: 10px;
        box-sizing: border-box;
        color: rgba(0, 0, 0, 1);
        height: 36px;
        margin-bottom: 12px;
        padding: 8px 16px;
        width: 100%;
        outline: none;
    }
</style>
