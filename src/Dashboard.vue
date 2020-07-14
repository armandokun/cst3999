<template>
    <div id="wrapper">
        <NavigationBar/>
        <div id="dashboard">
            <div id="main">
                <img src="./assets/sea.jpg" alt="Sea Shore"/>
                <h5 id="guide-title">{{audioGuide.title}}</h5>
                <span class="material-icons" id="play-btn">
                play_circle_filled
            </span>
                <p id="instruction-text">Press Play Icon to meditate for {{audioGuide.minutes}} minutes to improve your
                    focus and threshold.</p>
            </div>
            <div class="tabs" id="tab-1">
                <h4 class="tab-title">Current Threshold</h4>
                <div class="tab-score">{{currentThreshold}}</div>
            </div>
            <div class="tabs" id="tab-2">
                <h4 class="tab-title">Last Training Score</h4>
                <div class="tab-score">{{lastTrainingScore}}</div>
            </div>
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
                audioGuide: {
                    minutes: 10,
                    title: 'Ocean'
                },
                tabs: [
                    {
                        title: 'Current Threshold',
                        score: this.currentThreshold
                    },
                    {
                        title: 'Last Training Score',
                        score: this.lastTrainingScore
                    },
                    // {
                    //     title: 'Medit8s Completed',
                    //     score: 0
                    // }
                ],
                currentThreshold: 0,
                lastTrainingScore: 0
            }
        },
        methods: {
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
                            console.log(msgEvent.data);
                            reject(error);
                        }
                    };
                });
            },

            // Current Threshold & Last Training Score Tabs
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

                                //Round the numbers to two after the .
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
            }
        },
        async mounted() {
            await this.createSession().then(sessionID => sessionStorage.setItem('sessionID', sessionID));
            await this.mentalCommandTrainingThreshold();
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

    img {
        border-radius: 5px;
        width: 100%;
        height: 300px;
        filter: brightness(70%)
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

    #main {
        grid-column: 1 / 4;
        grid-row: 1 / 3;
        margin-top: 10px;
        position: relative;
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

    #dashboard {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        margin-left: 40px;
        margin-top: 10px;
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
</style>
