'use strict';
// Require the Box SDK and the fs module
const box = require('box-node-sdk');
const fs = require('fs');

// Read and parse the automatically created Box configuration file.
var configFile = fs.readFileSync('config.json');
configFile = JSON.parse(configFile);

// Initialize the SDK with the Box configuration file and create a client that uses the Service Account.
var session = box.getPreconfiguredInstance(configFile);

var serviceAccountClient = session.getAppAuthClient('user');

// Use the users.get method to retrieve current user's information by passing 'me' as the ID.
// Since this client uses the Service Account, this will return the Service Account's information.
serviceAccountClient.users.get('me', null)
    .then((serviceAccountUser) => {
        // Log the Service Account's login value which should contain "AutomationUser". 
        // For example, AutomationUser_375517_dxVhfxwzLL@boxdevedition.com
        console.log(serviceAccountUser.login)
    })
    .catch((err) => {
        // Log any errors for debugging 
        console.log(err);
    });
