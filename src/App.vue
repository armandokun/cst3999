<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script>
    export default {
        name: 'App',
        methods: {
            authorize: function () {
                const AUTHORIZE_ID = 1;
                let authorizeRequest = {
                    'jsonrpc': '2.0', 'method': 'authorize',
                    'params': {
                        'clientId': this.$user.clientId,
                        'clientSecret': this.$user.clientSecret,
                    },
                    'id': AUTHORIZE_ID
                };

                let ref = this;

                let message = JSON.stringify(authorizeRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise((resolve, reject) => {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`);
                        try {
                            let parsedResult = JSON.parse(msgEvent.data);
                            if (parsedResult['id'] === AUTHORIZE_ID) {
                                let authToken = parsedResult['result']['cortexToken'];
                                resolve(authToken);
                            } else {
                                console.log('IDs dont match')
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                })
            },
            queryHeadsetId: function () {
                const QUERY_HEADSET_ID = 2;
                let queryHeadsetRequest = {
                    'jsonrpc': '2.0',
                    'id': QUERY_HEADSET_ID,
                    'method': 'queryHeadsets',
                };

                let ref = this;

                let message = JSON.stringify(queryHeadsetRequest);
                console.log(`SENT: ${message}`);
                ref.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    ref.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`);

                        try {
                            let parsedResult = JSON.parse(msgEvent.data);
                            if (parsedResult['id'] === QUERY_HEADSET_ID) {
                                if (parsedResult['result'].length > 0) {
                                    let headsetId = parsedResult['result'][0]['id'];
                                    resolve(headsetId);
                                } else {
                                    alert('The headset has not been detected, please make sure you have connected the headset to your local machine.');
                                    reject('The headset has not been detected, please make sure you have connected the headset to your local machine.');
                                }
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    }
                });
            }
        },
        mounted() {
            let ref = this;
            this.$websocket.onopen = async function () {
                console.log('WebSocket is connected');
                await ref.queryHeadsetId()
                    .then(headsetID => sessionStorage.setItem('headsetID', headsetID));
                await ref.authorize()
                    .then(cortexToken => sessionStorage.setItem('cortexToken', cortexToken));


            };

            this.$websocket.onmessage = function (e) {
                console.log(`RESPONSE: ${e.data}`)
            }

            this.$websocket.onerror = function (error) {
                console.error(`WEBSOCKET ERROR: ${error}`)
            }
        }
    }
</script>

<style>
    #app {
        font-family: "Roboto M", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 20px;
    }

    a {
        color: #A99E9E;
        text-decoration: none;
        font-weight: 500;
        font-family: Roboto, Roboto, "Helvetica Neue", "Times New Roman", sans-serif;
        transition: color 0.25s;
        margin: 20px 0;
        cursor: pointer;
    }

    a:hover {
        color: #2BE4AD;
    }

    button {
        width: 100%;
        padding: 10px 20px;
        background-color: #2BE4AD;
        border-radius: 5px;
        border: none;
        color: white;
        cursor: pointer;
        outline: none;

        font-weight: 500;
        font-family: Roboto, "Helvetica Neue", "Times New Roman", sans-serif;
        font-size: 14px;
        transition: background-color 0.25s;
    }

    button:hover {
        background-color: #6be5b4;
    }

    button:active {
        background-color: #02bb89;
    }
</style>