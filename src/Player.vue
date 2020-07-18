<template>
    <div class="player">
        <div class="bg" :style="{ backgroundImage: 'url(' + guide.img + ')' }">
            <audio autoplay id="source">
                <source :src="guide.sound" :volume="guide.volume">
            </audio>
            <div id="center-wrapper">
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
                                <input type="range"
                                       @change="volumeControl()"
                                       min="1"
                                       max="10"
                                       value="5"
                                       id="volume-controller">
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Player",
        data() {
            return {
                guide: {
                    img: require('./assets/img/ocean-medium.jpg'),
                    sound: require('./assets/sounds/ocean.mp3'),
                    duration: 0,
                    volume: 1
                },
                showRange: false,
                audioPaused: false
            }
        },
        methods: {
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
            exitSession: function () {
                if (confirm("Do you want to leave the session?")) {
                    this.$router.push('/dashboard');
                } else {
                    console.log('Session continues');
                }
            },
            sessionControl: function () {
                let audio = document.getElementById('source');

                if (audio.paused) {
                    audio.play();
                    this.audioPaused = false;
                } else {
                    audio.pause();
                    this.audioPaused = true;
                }
            },
            volumeControl: function () {
                let audioSource = document.querySelector('#source');
                let volumeController = document.querySelector('#volume-controller');

                /* Needs to be divided by 10 since the volume range is [0..1] */
                audioSource.volume = volumeController.value / 10;
            }
        },
        mounted() {
            let guideTitle = (sessionStorage.getItem('guide')).toLocaleLowerCase();
            this.guide.img = require(`./assets/img/${guideTitle}-medium.jpg`);
            this.guide.sound = require(`./assets/sounds/${guideTitle}.mp3`);

            let self = this;

            let audio = document.getElementById('source');
            audio.ontimeupdate = function () {
                let duration = audio.duration - audio.currentTime;
                self.getGuideDuration(duration);
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

    #center-wrapper {
        grid-column: 1 / f;
        grid-row: 2 / 3;
        Position: absolute;
        Top: 50%;
        Left: 50%;
        Transform: translate(-50%, -50%);
    }
</style>
