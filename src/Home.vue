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
    </div>
</template>

<script>
    export default {
        name: 'Home',
        data() {
            return {
                // Stores profiles from queryProfiles
                profiles: [],
                // Display input for creating new profile
                showInput: false,

                profileName: ""
            }
        },
        methods: {
            /* This method returns the list of all the training profiles of the current account. */
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

            /* Creates a new profile */
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

            /* A profile must be loaded first, in order to subscribe to data streams,
             like 'com' & 'sys */
            loadProfile: async function (profileName) {
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
                    ref.$websocket.onmessage = async (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if ("error" in parsedResult) {
                                console.log(parsedResult);
                                await ref.unloadProfile();
                                await ref.loadProfile(profileName);
                            } else if (parsedResult['id'] === LOAD_PROFILE_ID) {
                                sessionStorage.setItem('profile', parsedResult.result.name);
                                await ref.$router.push('/dashboard');
                                resolve(msgEvent.data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            },

            /* In case of a need to use different account in the same app session.
             Current profile must be unloaded to load other one.*/
            unloadProfile: function () {
                let headsetID = sessionStorage.getItem('headsetID');
                let cortexToken = sessionStorage.getItem('cortexToken');

                const UNLOAD_PROFILE_ID = 7;
                let unloadProfileRequest = {
                    'jsonrpc': '2.0',
                    'method': 'setupProfile',
                    'params': {
                        'cortexToken': cortexToken,
                        'headset': headsetID,
                        'profile': '',
                        'status': 'unload'
                    },
                    'id': UNLOAD_PROFILE_ID
                };

                let ref = this;

                let message = JSON.stringify(unloadProfileRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === UNLOAD_PROFILE_ID) {
                                sessionStorage.setItem('profile', 'Guest Profile');
                                resolve(msgEvent.data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                });

            }
        },
        mounted() {
            let ref = this;
            let queryProfileInterval = setInterval(async () => {
                // If websocket is not busy retrieving data, then initialize this.
                // Do not stop until executed.
                if (this.$websocket.bufferedAmount === 0 && sessionStorage.getItem('cortexToken')) {
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
        grid-column: 3 / 4;
        align-self: center;
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
