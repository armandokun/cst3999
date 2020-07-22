<template>
    <div id="training-player">
        <div v-if="!trainingInProgress">
            <div v-if="this.$route.params.action === 'neutral'">
                <h2>To start meditating, first, you need to train your {{action.name}} brain state at least
                    {{5-action.times}}
                    {{times}}.</h2>
                <h2>Each training takes 8 seconds.</h2>
            </div>
            <div v-else>
                <h2>Now, you will have to train your meditative state at least
                    {{5-action.times}}
                    {{times}}.</h2>
                <h2>Each training takes 8 seconds.
                    You should hear background music respectively
                    to the meditation guide selected.</h2>
                <h2 style="color: red">Please close your eyes. Headphones recommended.</h2>
            </div>
            <p>When you are ready, press a button to begin</p>
            <button class="primary-btn" :class="{ disabled: countdownStarted }" @click="startTraining">Start Training
            </button>
            <div class="training-countdown" v-show="countdownStarted">
                <span>Training Starts in: </span>
                <span id="cd-sec"/>
            </div>
        </div>
        <div v-show="trainingInProgress && !trainingFinished">
            <audio id="source">
                <source :src="action.sound">
            </audio>
            <div id="training-in-progress">Time Left: 00:0<span id="cd-sec-training"></span></div>
        </div>

        <div v-if="trainingFinished" id="after-training">
            <h1>Do you accept this training?</h1>
            <button class="primary-btn" @click="trainRequest(action.name, 'accept')">Accept</button>
            <button class="primary-btn disabled" @click="trainRequest(action.name, 'reject')">Reject</button>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Training",
        data() {
            return {
                action: {
                    title: '',
                    name: this.$route.params.action,
                    times: 0,
                    sound: ''
                },
                trainingInProgress: false,
                times: '',
                countdownStarted: false,
                trainingFinished: false
            }
        },
        methods: {

            /* Get correct noun for the word times/time according to the number of trainings left to be completed */
            getNoun: function () {
                (5 - this.action.times === 1) ?
                    this.times = 'time' : this.times = 'times';
            },

            // Assign a sound accordingly to the meditation guide
            setActionSound: function () {
                switch (this.action.name) {
                    case 'push' :
                        this.action.title = 'ocean';
                        this.action.sound = require(`./assets/sounds/${this.action.title}.mp3`)
                        break;

                    case 'lift' :
                        this.action.title = 'rain';
                        this.action.sound = require(`./assets/sounds/${this.action.title}.mp3`)
                        break;

                    case 'pull' :
                        this.action.title = 'forest';
                        this.action.sound = require(`./assets/sounds/${this.action.title}.mp3`)
                        break;

                    default:
                        break;
                }
            },

            /* Get Actions Data from API */
            getActionTimesCompleted: function () {
                let cortexToken = sessionStorage.getItem('cortexToken');
                let profileName = sessionStorage.getItem('profile');
                const GET_ACTIONS_ID = 12;

                let getActionsRequest = {
                    "id": GET_ACTIONS_ID,
                    "jsonrpc": "2.0",
                    "method": "getTrainedSignatureActions",
                    "params": {
                        "cortexToken": cortexToken,
                        "detection": "mentalCommand",
                        "profile": profileName
                    }
                };

                let self = this;

                let message = JSON.stringify(getActionsRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === GET_ACTIONS_ID) {
                                let actions = parsedResult['result']['trainedActions'];

                                // Query for finding the right index of actions from getTrainedSignatureActions
                                const query = (object) => object.action === self.action.name

                                // Find an index of the action
                                let actionIndex = actions.findIndex(query);

                                // Retrieve the object
                                if (actions[actionIndex] === undefined) {
                                    self.action.times = 0;
                                } else {
                                    let actionTimes = actions[actionIndex].times;
                                    self.action.times = actionTimes;

                                    let actionName = actions[actionIndex].action;

                                    console.log(actionName, actionTimes);
                                }
                                resolve(actions);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            },
            startTraining: async function () {
                let self = this;
                if (self.action.name !== undefined) {

                    // Necessary to subscribe for the stream to receive this type of data
                    await this.subscribe(['sys']);

                    // To disable button
                    this.countdownStarted = true;

                    // Set countdown to alert the user
                    this.countdown(3);

                    // After the countdown, init trainRequest
                    setTimeout(async function () {
                        let meditationSound = document.querySelector('#source');
                        meditationSound.play();
                        await self.trainRequest(self.action.name, 'start');
                    }, 3100);
                }
            },
            countdown: function (seconds) {
                let counter = {};

                // Get the containers
                counter.sec = document.querySelector("#cd-sec");

                if (this.trainingInProgress) {
                    counter.sec = document.querySelector("#cd-sec-training");
                }

                // Set the countdown
                counter.sec.innerHTML = seconds;

                // EXAMPLE - 5 MINS = 5 X 60 = 300 SECS
                counter.end = seconds;

                // Start if not past end date
                if (counter.end > -1) {
                    counter.ticker = setInterval(function () {
                        // Stop if passed end time
                        counter.end--;
                        if (counter.end <= 0) {
                            clearInterval(counter.ticker);
                            counter.end = 0;
                        }

                        // Update HTML
                        counter.sec.innerHTML = counter.end;
                    }, 1000);
                }
            },
            subscribe: function (stream) {
                let authToken = sessionStorage.getItem('cortexToken');
                let sessionId = sessionStorage.getItem('sessionID');

                const SUB_REQUEST_ID = 20;
                let subRequest = {
                    'jsonrpc': '2.0',
                    'method': 'subscribe',
                    'params': {
                        'cortexToken': authToken,
                        'session': sessionId,
                        'streams': stream
                    },
                    'id': SUB_REQUEST_ID
                };

                let self = this;

                let message = JSON.stringify(subRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === SUB_REQUEST_ID) {
                                resolve(parsedResult['result']['id']);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            },
            saveProfile: function () {
                let profileName = sessionStorage.getItem('profile');
                let headsetId = sessionStorage.getItem('headsetID');
                let cortexToken = sessionStorage.getItem('cortexToken');

                const SAVE_PROFILE_ID = 13;
                let saveProfileRequest = {
                    "id": SAVE_PROFILE_ID,
                    "jsonrpc": "2.0",
                    "method": "setupProfile",
                    "params": {
                        "cortexToken": cortexToken,
                        "headset": headsetId,
                        "profile": profileName,
                        "status": "save"
                    }
                }

                let self = this;

                let message = JSON.stringify(saveProfileRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === SAVE_PROFILE_ID) {
                                resolve(parsedResult['result']);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });

            },
            trainRequest: function (action, status) {
                let authToken = sessionStorage.getItem('cortexToken');
                let sessionId = sessionStorage.getItem('sessionID');

                const TRAINING_ID = 8;
                let trainingRequest = {
                    'jsonrpc': '2.0',
                    'method': 'training',
                    'params': {
                        'cortexToken': authToken,
                        'detection': 'mentalCommand',
                        'session': sessionId,
                        'action': action,
                        'status': status
                    },
                    'id': TRAINING_ID
                };

                let self = this;

                let message = JSON.stringify(trainingRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = async (msgEvent) => {
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === TRAINING_ID) {
                                console.log(`RESPONSE: ${msgEvent.data}`);

                                // To hide the div with instructions
                                self.trainingInProgress = true;

                                // Alert the user of what time is left
                                self.countdown(8);
                            }
                        } catch (error) {
                            reject(error);
                        }

                        // in case status is start training, only resolve until see "MC_Succeeded"
                        if (status === 'start') {
                            try {
                                if (parsedResult['sys'][1] === 'MC_Succeeded') {
                                    console.log('START TRAINING RESULT --------------------------------------');
                                    console.log(parsedResult);

                                    self.trainingFinished = true;
                                    let meditationSound = document.querySelector('#source');
                                    meditationSound.pause();
                                }
                            } catch (error) {
                                reject(error);
                            }
                        }

                        // in case status is accept training, only resolve until see "MC_Completed"
                        if (status === 'accept') {
                            try {
                                if (parsedResult['sys'][1] === 'MC_Completed') {
                                    console.log('ACCEPT TRAINING RESULT --------------------------------------');
                                    console.log(msgEvent.data);

                                    // Do not display on the last training
                                    if (self.action.times !== 4) {
                                        if (confirm("Do you want to train again?")) {
                                            // Save profile and then refresh the count of completed states
                                            await self.saveProfile();

                                            // To refresh the count of times completed
                                            await self.getActionTimesCompleted();

                                            // Refresh times noun
                                            self.getNoun();

                                            self.countdownStarted = false;
                                            self.trainingFinished = false;
                                            self.trainingInProgress = false;
                                        } else {
                                            await self.saveProfile();
                                            await self.unsubscribe(['sys']);

                                            // Must be else statement if want to display the choices in the alert pop up
                                            await self.$router.push('/dashboard');
                                        }
                                    } else {
                                        await self.saveProfile();
                                        await self.unsubscribe(['sys']);
                                        await self.$router.push('/dashboard');
                                    }
                                    resolve(msgEvent.data);
                                }
                            } catch (error) {
                                console.log('error in status === accept', msgEvent.data);
                                reject(error);
                            }
                        }

                        if (status === 'reject') {
                            try {
                                if (parsedResult['sys'][1] === 'MC_Rejected') {
                                    if (confirm("Do you want to restart the training?")) {
                                        self.countdownStarted = false;
                                        self.trainingFinished = false;
                                        self.trainingInProgress = false;
                                    } else {
                                        await self.unsubscribe(['sys']);
                                        // Must be else statement if want to display the choices in the alert pop up
                                        await self.$router.push('/dashboard');
                                    }
                                }
                            } catch (e) {
                                resolve(e);
                            }
                        }
                    };
                });
            },
            unsubscribe: function (stream) {
                let authToken = sessionStorage.getItem('cortexToken');
                let sessionId = sessionStorage.getItem('sessionID');

                const UNSUB_REQUEST_ID = 21;
                let subRequest = {
                    'jsonrpc': '2.0',
                    'method': 'unsubscribe',
                    'params': {
                        'cortexToken': authToken,
                        'session': sessionId,
                        'streams': stream
                    },
                    'id': UNSUB_REQUEST_ID
                };

                let self = this;

                let message = JSON.stringify(subRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === UNSUB_REQUEST_ID) {
                                resolve(parsedResult['result']['id']);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            }
        },
        mounted() {
            // Get the correct noun for 'times' in the heading of training player
            this.getNoun();

            // Assign a title to an action respectively
            this.setActionSound();

            // Get current action times completed
            this.getActionTimesCompleted();
        }
    }
</script>

<style scoped>
    #training-player {
        Position: absolute;
        Top: 50%;
        Left: 50%;
        Transform: translate(-50%, -50%);
    }

    .primary-btn {
        width: 20%;
    }

    .training-countdown {
        margin-top: 20px;
    }

    .training-countdown span {
        font-size: 36px;
    }

    .disabled {
        background-color: #CCC7C7;
    }

    #training-in-progress {
        font-size: 24px;
    }

    #after-training > * {
        margin: 10px;
    }

</style>
