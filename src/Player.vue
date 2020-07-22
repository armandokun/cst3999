<template>
    <div class="player">
        <div class="bg" :style="{ backgroundImage: 'url(' + guide.img + ')' }">
            <audio autoplay id="source">
                <source :src="guide.sound">
            </audio>
            <div class="center-wrapper" v-if="!trainingFinished">
                <h1>Time Remaining</h1>
                <h1>{{guide.duration}}</h1>
                <div id="controls">
                    <div class="icon" @click="exitSession">
                        <span class="material-icons">stop</span>
                        <div>Stop</div>
                    </div>
                    <div class="icon" @click="sessionControl" v-if="!audioPaused">
                        <span class="material-icons">pause</span>
                        <div>Pause</div>
                    </div>
                    <div class="icon" v-if="audioPaused" @click="sessionControl">
                        <span class="material-icons">play_arrow</span>
                        <div>Play</div>
                    </div>
                    <div class="icon">
                        <span class="material-icons" @click="showRange = !showRange">volume_up</span>
                        <div :class="{active: showRange}">Volume</div>
                        <div :class="{active: !showRange}">
                            <label for="volume-controller">
                            </label>
                            <input type="range"
                                   name="volume-controller"
                                   @change="volumeControl()"
                                   min="1"
                                   max="10"
                                   :value="guide.volume"
                                   id="volume-controller">
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="center-wrapper">
                <h1>Time is up!</h1>
                <h1>Your average score is: {{trainingAverage}}</h1>
                <p style="margin-top: 20px; font-size: 24px">Practice more to improve it!</p>
                <button class="primary-btn" style="width: 30%" @click="returnToDashboard">Return to Dashboard</button>
            </div>
        </div>
    </div>
</template>

<script>
    import Training from "./Training";

    export default {
        name: "Player",
        components: Training,
        data() {
            return {
                guide: {
                    img: require('./assets/img/ocean-medium.jpg'),
                    sound: require('./assets/sounds/ocean.mp3'),
                    duration: 0,
                    volume: 5
                },
                // Volume Range in Player
                showRange: false,
                audioPaused: false,

                trainingResults: [],
                trainingAverage: 0,
                trainingFinished: false
            }
        },
        methods: {
            /* Format time of the guide duration */
            getGuideDuration: function (duration) {
                // Hours, minutes and seconds
                let hrs = ~~(duration / 3600);
                let mins = ~~((duration % 3600) / 60);
                let secs = ~~duration % 60;

                // Output like "1:01" or "4:03:59" or "123:03:59"
                let ret = "";

                if (hrs > 0) {
                    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
                }

                ret += "" + mins + ":" + (secs < 10 ? "0" : "");
                ret += "" + secs;

                this.guide.duration = ret;
            },
            /* Stop the meditating session and return to the dashboard*/
            exitSession: function () {
                if (confirm("Do you want to leave the session?")) {
                    this.unsubscribeCoreTraining(['com']);
                    this.$router.push('/dashboard');
                } else {
                    // Must be else statement if want to display the choices in the alert pop up
                    console.log('Session continues');
                }
            },
            /* Play/Pause meditation guide controller */
            sessionControl: function () {
                let audio = document.getElementById('source');

                if (audio.paused) {
                    this.coreTraining(['com']);
                    audio.play();
                    this.audioPaused = false;
                } else {
                    audio.pause();
                    this.unsubscribeCoreTraining(['com']);
                    this.audioPaused = true;
                }
            },
            /* Controls Volume of meditation guide */
            volumeControl: function () {
                let audioSource = document.querySelector('#source');
                let volumeController = document.querySelector('#volume-controller');

                // Needs to be divided by 10 since the volume range for source is [0..1]
                audioSource.volume = volumeController.value / 10;
                this.guide.volume = volumeController.value;
            },
            /* subscribe method as seen in Training.vue,
             designed to be specifically used during the meditation sessions */
            coreTraining: function (stream) {
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
                                // if action names matches then add the result to array
                                if (parsedResult['com'][0] ===
                                    `${sessionStorage.getItem('guideAction')}`) {
                                    self.trainingResults.push(parsedResult['com'][1]);

                                    // Volume change if received enough data to evaluate
                                    // (remainder of 11, array starts from 0
                                    if (self.trainingResults.length % 11 === 0) {
                                        // Get last 10 elements of an array
                                        let lastTrainingResults = self.trainingResults.slice(1).slice(-10);

                                        let temporary = 0;
                                        lastTrainingResults.forEach(element => temporary += element);
                                        let lastTrainingAvg = temporary / 10;

                                        console.log('last training average', lastTrainingAvg,
                                            'lastTrainingResult', lastTrainingResults);
                                        // Find audio source
                                        let audioSource = document.querySelector('#source');

                                        if (lastTrainingAvg < 0.5 && audioSource.volume !== 1) {
                                            console.log('before', audioSource.volume);
                                            audioSource.volume += 0.1;
                                            console.log('after', audioSource.volume);
                                            // Input range and volume range have a difference by 10
                                            self.guide.volume = audioSource.volume * 10;
                                        } else if (lastTrainingAvg > 0.5 && audioSource.volume > 0.5) {
                                            console.log('before', audioSource.volume);
                                            audioSource.volume -= 0.1;
                                            console.log('after', audioSource.volume);
                                            self.guide.volume = audioSource.volume * 10;
                                        }
                                    }
                                }
                            } catch
                                (error) {
                                console.log(msgEvent.data);
                                reject(error);
                            }
                        };
                    }
                )
                    ;
            },
            /* unsubscribe method as seen in Training.vue,
             designed to be specifically used during the meditation sessions */
            unsubscribeCoreTraining: function (stream) {
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
            ,
            returnToDashboard: function () {
                this.$router.push('/dashboard');
            }
        },
        mounted() {
            let guideTitle = (sessionStorage.getItem('guide')).toLocaleLowerCase();
            this.guide.img = require(`./assets/img/${guideTitle}-medium.jpg`);
            this.guide.sound = require(`./assets/sounds/${guideTitle}.mp3`);

            let self = this;

            let audio = document.getElementById('source');
            audio.volume = 0.5;
            audio.ontimeupdate = function () {
                let duration = audio.duration - audio.currentTime;
                self.getGuideDuration(duration);
            }

            // subscribe to com - to begin session in LIVE mode
            // (LIVE mode dedicated to meditation sessions only)
            this.coreTraining(['com']);

            audio.onended = function () {
                self.unsubscribeCoreTraining(['com']);

                // Calculating the average score
                self.trainingResults.forEach(result => self.trainingAverage += result);
                self.trainingAverage = Math.round((self.trainingAverage / self.trainingResults.length) * 100) / 100

                // display the score
                self.trainingFinished = true;
            }

        }
    }
</script>

<style scoped>
    h1 {
        margin: 0;
        padding: 10px;
        font-size: 60px;
    }

    .player {
        height: 100%;
        color: white;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }

    .bg {
        grid-column: 1 / fr;
        grid-row: 1 / fr;

        /* Full height */
        height: 100%;

        /* Center and scale the image nicely */
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    .icon {
        display: inline-block;
        font-size: 20px;
        font-weight: 500;
        margin: 0 25px;
        cursor: pointer;
        transition: font-size, 0.25s;
    }

    .icon span {
        font-size: 60px;
        transition: font-size, 0.25s;
    }

    .icon:hover span {
        font-size: 65px;
    }

    .icon:hover {
        font-size: 22px;
    }

    .active {
        display: none;
    }

    #controls {
        margin-top: 2em;
    }

    .center-wrapper {
        grid-column: 1 / f;
        grid-row: 2 / 3;
        Position: absolute;
        Top: 50%;
        Left: 50%;
        Transform: translate(-50%, -50%);
    }
</style>
