<template>
    <div id="wrapper">
        <NavigationBar/>
        <div id="dashboard">
            <div id="main">
                <ul>
                    <li id="main-guide" v-bind:style="{ backgroundImage: 'url(' + mainAudioGuide.img + ')' }"/>
                </ul>
                <h5 id="guide-title">{{mainAudioGuide.title}}</h5>
                <span @click="startTraining()" class="material-icons" id="play-btn">
                play_circle_filled
            </span>
                <p id="instruction-text">Press Play Icon to meditate for {{mainAudioGuide.duration}} minutes to improve
                    your
                    focus and threshold.</p>
            </div>
            <div class="tabs" id="tab-1">
                <div class="tooltip" id="threshold-tooltip">
                    <span class="material-icons">
                        info
                    </span>
                    <span class="tooltiptext">The training threshold provides
                        an indication of minimum threshold that you
                        should target during the meditation session..</span>
                </div>
                <h4 class="tab-title">Current Threshold</h4>
                <div class="tab-score">{{currentThreshold}}</div>
            </div>
            <div class="tabs" id="tab-2">
                <div class="tooltip" id="last-score-tooltip">
                    <span class="material-icons">
                        info
                    </span>
                    <span class="tooltiptext">Any meditation session score above
                        the threshold is very likely to improve your profile.
                        Any meditating score significantly below the threshold is
                        likely to reduce the quality of your profile.</span>
                </div>
                <h4 class="tab-title">Last Training Score</h4>
                <div class="tab-score">{{lastTrainingScore}}</div>
            </div>
            <div class="tabs" id="tab-3">
                <h4 class="tab-title">Trainings Completed</h4>
                <div class="tab-score">{{totalTrainingsCompleted}}</div>
            </div>
            <ul id="guide-selection">
                <li v-for="guide in availableGuides"
                    v-bind:key="guide.id"
                    @click="changePlayer(guide.title)"
                    v-bind:style="{ backgroundImage: 'url(' + guide.img + ')' }">
                    {{guide.title}}
                    <span class="guide-duration">
                        {{guide.duration}} min
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import NavigationBar from "./components/NavigationBar";

    export default {
        name: "Dashboard",
        components: {NavigationBar},
        data() {
            return {
                profileName: sessionStorage.getItem('profile'),
                // Meditation guide on the main div
                mainAudioGuide: {
                    duration: 10,
                    title: 'Ocean',
                    img: require('./assets/img/ocean.jpg'),
                    action: 'push'
                },
                availableGuides: [
                    {
                        title: 'Rain',
                        duration: 15,
                        img: require('./assets/img/rain.jpg'),
                        action: 'lift'
                    },
                    {
                        title: 'Forest',
                        duration: 10,
                        img: require('./assets/img/forest.jpg'),
                        action: 'pull'
                    },
                ],
                // Tab information
                currentThreshold: 0,
                lastTrainingScore: 0,
                totalTrainingsCompleted: 0,

                // Saves actions from getTrainedSignatureActions
                actions: []
            }
        },
        methods: {
            /* This method is to open a session with an EMOTIV headset. */
            createSession: function () {
                let cortexToken = sessionStorage.getItem('cortexToken');
                let headsetID = sessionStorage.getItem('headsetID');

                const CREATE_SESSION_ID = 5;
                let createSessionRequest = {
                    'jsonrpc': '2.0',
                    'id': CREATE_SESSION_ID,
                    'method': 'createSession',
                    'params': {
                        'cortexToken': cortexToken,
                        'headset': headsetID,
                        'status': 'active'
                    }
                };

                let self = this;

                let message = JSON.stringify(createSessionRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === CREATE_SESSION_ID) {
                                let sessionId = parsedResult['result']['id'];
                                resolve(sessionId);
                            }
                        } catch (error) {
                            if (sessionStorage.getItem('sessionID')) {
                                resolve(sessionStorage.getItem('sessionID'));
                            } else {
                                console.log(msgEvent.data);
                                reject(error);
                            }
                        }
                    };
                });
            },

            /* This method returns the training threshold of the mental command detection.
            * It also returns the score of the last mental command training.
            */
            mentalCommandTrainingThreshold: function () {
                let cortexToken = sessionStorage.getItem('cortexToken');
                let sessionID = sessionStorage.getItem('sessionID');

                const MC_TRAINING_THRESHOLD_ID = 11;
                let MCTrainingThresholdRequest = {
                    "id": MC_TRAINING_THRESHOLD_ID,
                    "jsonrpc": "2.0",
                    "method": "mentalCommandTrainingThreshold",
                    "params": {
                        "cortexToken": cortexToken,
                        "session": sessionID
                    }
                };
                let self = this;

                let message = JSON.stringify(MCTrainingThresholdRequest);
                console.log(`SENT: ${message}`);
                self.$websocket.send(message);

                return new Promise(function (resolve, reject) {
                    self.$websocket.onmessage = (msgEvent) => {
                        console.log(`RESPONSE: ${msgEvent.data}`)
                        let parsedResult = JSON.parse(msgEvent.data);

                        try {
                            if (parsedResult['id'] === MC_TRAINING_THRESHOLD_ID) {
                                let currentThreshold = parsedResult['result']['currentThreshold'];
                                let lastTrainingScore = parsedResult['result']['lastTrainingScore'];

                                //Round the numbers and save it to component's data
                                self.lastTrainingScore = Math.round(lastTrainingScore * 100) / 100;
                                self.currentThreshold = Math.round(currentThreshold * 100) / 100;

                                resolve(parsedResult);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            },

            /*
            * This method returns the list of the trained actions of a profile.
            * For each action, you also see how many times the user trained this action.
            */
            getTrainedSignatureActions: function () {
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
                }

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

                                self.actions = actions;

                                let completedTrainings = 0;

                                actions.forEach(action => {
                                        completedTrainings += action.times
                                });

                                self.totalTrainingsCompleted = completedTrainings;
                                resolve(actions);
                            }
                        } catch (error) {
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            },

            /* Change a guide by clicking on the list of guides */
            changePlayer: function (guideTitle) {
                // Store Current mainAudioGuide
                let mainAudioGuide = this.mainAudioGuide;

                // Find an object which title matches guideTitle
                let guideID = this.availableGuides.findIndex(x => x.title === guideTitle);

                /* Replace mainAudioGuide properties with that object
                 * Remove the selected one from array
                 */
                this.mainAudioGuide = this.availableGuides.splice(guideID, 1)[0];

                // Save old mainAudioGuide to the availableGuides Array
                this.availableGuides.push(mainAudioGuide);
            },

            /* Sends the user to the right path to train.
            If neutral and meditation guide's state has been trained for at least 5 times,
            grant access to Player */
            startTraining: function () {

                // Save details for later usage in Training
                sessionStorage.setItem('guide', this.mainAudioGuide.title);
                sessionStorage.setItem('guideAction', this.mainAudioGuide.action);

                // Get brain states trained first if new profile
                let neutralState;
                if (this.actions.length !== 0) {
                    neutralState = this.actions[0];

                    // Query for finding the right index of actions from getTrainedSignatureActions
                    const query = (object) => object.action === this.mainAudioGuide.action;

                    // Find an index of the action
                    let actionIndex = this.actions.findIndex(query);

                    if (this.actions[actionIndex] === undefined) {
                        this.$router.push(`/training/${this.mainAudioGuide.action}`);
                    } else {
                        // Retrieve the object
                        let actionTimes = this.actions[actionIndex].times;
                        let actionName = this.actions[actionIndex].action;

                        // Run this, if neutral state haven't been trained for 5 times
                        if (neutralState.times < 5) {
                            this.$router.push(`/training/neutral/`);
                        } else if (actionTimes < 5) {
                            this.$router.push(`/training/${actionName}`);
                        } else {
                            // all conditions passed, going into meditation session
                            this.$router.push('/player');
                        }
                    }
                } else {
                    this.$router.push('/training/neutral');
                }
            }
        },
        async mounted() {
            // Initiate a session
            await this.createSession().then(sessionID => {
                sessionStorage.setItem('sessionID', sessionID.toString());
            });

            // Create Information Tabs
            await this.mentalCommandTrainingThreshold();
            await this.getTrainedSignatureActions();
        }
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

    #main {
        grid-column: 1 / 4;
        grid-row: 1 / 3;
        margin-top: 10px;
        position: relative;
    }

    #main-guide {
        border-radius: 5px;
        width: 100%;
        height: 300px;
        filter: brightness(70%);
        padding: 0;
    }

    #play-btn {
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 70px;
        color: white;
        transition: font-size 0.25s;
        cursor: pointer
    }

    #play-btn:hover {
        font-size: 80px;
    }

    .tabs {
        width: 140px;
        height: 140px;
        background-color: #FCFCFC;
        border: #CCC7C7 1px solid;
        border-radius: 5px;
        grid-row-gap: 10px;
    }

    .tab-title {
        margin: 10px 15px;
        text-align: left;
    }

    .tab-score {
        text-align: right;
        font-size: 48px;
        font-weight: 500;
        margin-top: 30px;
        margin-right: 15px;
    }

    #dashboard {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        margin: 10px 40px;
    }

    #guide-title {
        margin: 0;
        position: absolute;
        top: 7%;
        left: 7%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 16px;
    }

    #instruction-text {
        margin: 0;
        position: absolute;
        top: 92%;
        left: 53%;
        transform: translate(-50%, -50%);
        color: white;
        text-align: left;
        width: 100%;
        font-weight: 500;
        font-size: 15px;
        font-family: Roboto, "Helvetica Neue", "Times New Roman", sans-serif;
    }

    #tab-1 {
        grid-row: 1;
        align-self: center;
        justify-self: center;
    }

    #tab-2 {
        grid-row: 2;
        align-self: center;
        justify-self: center;
    }

    #tab-3 {
        align-self: center;
        justify-self: left;
    }

    /* Icon positioning */
    #threshold-tooltip {
        top: 11%;
    }

    #last-score-tooltip {
        top: 33%
    }

    .tooltip {
        position: absolute;
        right: 36%;
    }

    .tooltip .tooltiptext {
        visibility: hidden;
        width: 300px;
        background-color: black;
        color: #fff;
        text-align: left;
        border-radius: 5px;
        padding: 10px;
        position: absolute;
        z-index: 1;
        top: -5px;
        left: 110%;
    }

    .tooltip:hover .tooltiptext {
        visibility: visible;
    }

    #guide-selection {
        grid-row: 3;
        grid-column: 1 / 3;
        width: 75%;
    }

    #guide-selection li {
        margin-bottom: 10px;
        cursor: pointer;
        opacity: 100%;
        transition: opacity 0.25s;
    }

    #guide-selection li:hover {
        opacity: 80%;
    }

    #guide-selection li:first-child {
        margin-top: 10px;
    }

    .guide-duration {
        float: right;
    }
</style>
