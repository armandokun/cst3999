---
description: >-
  For a more delightful experience, visit
  https://armandasvaicikauskas.gitbook.io/cst3999-software-documentation/
---

# Getting Started

## Abstract

You are about to embark in the reading of the documentation that contains instructions to run my undergraduate final project. 

The project's main goal was to develop a neurofeedback-assisted meditation software which will provide auditory cues if and when the subjects’ mind starts to wander. To alert the user, the application will slowly increase the volume of the meditating guide until the point when the participant returns to their centre of focus, ordinarily breath.

The project's engine is built with Vue.js using Cortex API - the core piece of technology at EMOTIV which brings the brain computer interface to consumer.

The Cortex API is built on JSON and WebSockets, making it easy to access from a variety of programming languages and platforms.

## Supported Software & Hardware

The headset I worked with for this project, is called _Emotiv EPOC+_. The project has been successfully developed by using _MacOS Catalina_.   
Other platforms and hardware that could support this app are listed on the official [Cortex API documentation](https://emotiv.gitbook.io/cortex-api/), below 'Getting Started' article.

## Prerequisites

To be able to run this project, a few actions must be completed prior to launching:

{% hint style="info" %}
**Mind the fact, when trying to initialise this project, one of the EMOTIV's neuro-headsets must be presented.**
{% endhint %}

### Create an Emotiv ID

As with other EMOTIV services, you are required to have an Emotiv ID account. You can create an ID on [www.emotiv.com](https://www.emotiv.com/).

### Create a Cortex App

Create the **application ID** and generate the corresponding **client ID** and **client secret** for your application in order to grant access to Cortex API.

1. Login to www.emotiv.com.
2. Go to My Account Dashboard \([https://www.emotiv.com/my-account/](https://www.emotiv.com/my-account/)\).
3. Select **Cortex Apps**.
4. Read the **Developers EULA** carefully and click **Accept** only if you agree to all the terms and conditions. You cannot develop an application that works with Cortex if you do not agree to all of the terms.
5. Enter the name of your new application - an application ID will be generated automatically in the form of `com.{your-username}.{application-name}`. Note that the app ID string must contain only alphanumeric characters \(A-Z, a-z, 0-9\), hyphens \(-\), and periods \(.\).
6. Click **Register Application**. A client ID and a client secret will be presented to you. Copy them to somewhere safe immediately **as the client secret will ONLY BE SHOWN ONCE ON THIS SCREEN FOR SECURITY**. If you lost it, you will have to generate a new application ID later.

{% hint style="info" %}







