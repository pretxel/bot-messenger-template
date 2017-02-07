import crypto from 'crypto'
import request from 'request'
import config from 'config'
import slugify from 'slugify'
import curl from 'curlrequest'
import Q from 'q'

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');


var facebook = {



    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    verifyRequestSignature: function (req, res, buf) {
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                .update(buf)
                .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    },

    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    receivedAuthentication: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        var passThroughParam = event.optin.ref;

        console.log("Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam,
            timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage(senderID, "Authentication successful");
    },

    /*
     * Message Event
     *
     * This event is called when a message is sent to your page. The 'message'
     * object format can vary depending on the kind of message that was received.
     * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
     *
     * For this example, we're going to echo any text that we get. If we get some
     * special keywords ('button', 'generic', 'receipt'), then we'll send back
     * examples of those bubbles to illustrate the special message bubbles we've
     * created. If we receive a message with an attachment (image, video, audio),
     * then we'll simply confirm that we've received the attachment.
     *
     */
    _all_users: {},

    receivedMessage: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;


        var options = { url: 'https://graph.facebook.com/v2.6/'+senderID+'?access_token='+PAGE_ACCESS_TOKEN, include: true };

        curl.request(options, function (err, data) {
            console.log(data);
        });

        console.log("Mensaje de %d en la página %d a las %d:", senderID, recipientID, timeOfMessage);
        console.log(JSON.stringify(message));

        if (!this._all_users[senderID]) {
            this._all_users[senderID] = {};
        }
        // _all_users[recipientID] = { senderID : {} };

        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;

        if (isEcho) {
            // Just logging message echoes to console
            console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
            return;
        } else if (quickReply) {
            var quickReplyPayload = quickReply.payload;
            console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);

            this.sendTextMessage(senderID, "Quick reply tapped");
            return;
        }


        /*if (messageText == 'ktboGO') {
            var ii;
            for (ii in _all_users) {
                // sendTextMessage(ii, 'Comenzó el partido Primara asd');
                this.sendButtonMessage(ii,
                    'Comenzó el partido de "Ignacio Zaragoza" contra "Miguel Hidalgo" ¿Pudiste ir?',
                    [{
                        type: "postback",
                        title: "Sí",
                        payload: "USER_IN_MATCH"
                    }, {
                        title: "No, manténganme informado",
                        type: "web_url",
                        url: "https://www.youtube.com/live"
                    }]
                );

            }
        }*/

        if (messageText) {
            var txt_as_command = slugify(messageText).replace('-', '').toLowerCase();
            switch (txt_as_command) {
                case 'hola':
                    this.sendTextMessage(senderID, '¡Hola! Bienvenido a Dron Brody');
                    /*this.sendButtonMessage(
                        senderID,
                        'El torneo 2017 está por arrancar te gustaría ...',
                        [{
                            type: "postback",
                            title: "Conocer la convocatoria",
                            payload: "WELCOME_ANNOUNCEMENT"
                        }, {
                            type: "postback",
                            title: "Conocer la historia del torneo",
                            payload: "WELCOME_HISTORY"
                        }, {
                            type: "postback",
                            title: "Postular a mi escuela",
                            payload: "POSTULATE_SCHOOL"
                        }]);*/
                    /*
                     var images = [
                     '/assets/gif/hello-1.gif',
                     '/assets/gif/hello-2.gif',
                     '/assets/gif/hello-3.gif',
                     '/assets/gif/hello-4.gif',
                     '/assets/gif/hello-5.gif',
                     ],
                     image = images[ parseInt( Math.random() * images.length, 10) ];
                     sendImageMessage(senderID, image);
                     */
                    break;
                default:
                    var is_fbui = new RegExp("^FB(\d+)$", 'i');
                    var match = is_fbui.exec(txt_as_command);
                    if (match) {
                        // txt_as_command
                        this.sendTextMessage(senderID, 'Tu número de jugador = ' + txt_as_command);
                    } else {
                        this.sendTextMessage(senderID, 'Hola');
                    }
            }
        } else if (messageAttachments) {
            this.sendTextMessage(senderID, "Gracias recibimos tu archivo");
        }
    },


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;

        if (messageIDs) {
            messageIDs.forEach(function (messageID) {
                console.log("Received delivery confirmation for message ID: %s", messageID);
            });
        }

        console.log("All message before %d were delivered.", watermark);
    },


    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     *
     */
    receivedPostback: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        var payload = event.postback.payload;

        console.log("Received postback for user %d and page %d with payload '%s' " +
            "at %d", senderID, recipientID, payload, timeOfPostback);

        switch (payload) {
            case 'WELCOME_PARTICIPANT':
                this.sendButtonMessage(senderID,
                    '¿Estás en 4o o 5o de primaria con promedio superior a 8.0?',
                    [{
                        type: "postback",
                        title: "Sí",
                        payload: "WELCOME_PARTICIPANT_OK"
                    }, {
                        type: "postback",
                        title: "No",
                        payload: "WELCOME_PARTICIPANT_KO"
                    }]
                );
                break;
            case 'WELCOME_PARTICIPANT_OK':
                this.sendTextMessage(senderID, "Eres el candidato/la candidata ideal, escríbenos el nombre de tu escuela y estado para darte prioridad en las inscripcipciones.");
                break;
            case 'WELCOME_PARTICIPANT_KO':
                this.sendTextMessage(senderID, "Lo sentimos pero no puedes participar, no te olvides de seguir a tu escuela primaria.");
                break;
            case 'WELCOME_SCHOOL':
                this.sendTextMessage(senderID, "Déjanos el nombre de tu escuela y estado para darte prioridad en las inscripcipciones.");
                break;
            case 'WELCOME_FAMILIAR':
                this.sendTextMessage(senderID, "Déjanos el nombre de la escuela y estado para darte prioridad en las inscripcipciones.");
                break;

            case 'USER_IN_MATCH':
                this.sendTextMessage(senderID, "Sube tus fotos y videos de las mejores jugadas y festejos del partido.");
                var images = [
                        '/assets/gif/photo-1.gif',
                        '/assets/gif/photo-2.gif',
                        '/assets/gif/photo-3.gif',
                        '/assets/gif/photo-4.gif',
                        '/assets/gif/photo-5.gif',
                    ],
                    image = images[parseInt(Math.random() * images.length, 10)];
                this.sendImageMessage(senderID, image);

                break;
            default:
                this.sendTextMessage(senderID, "-");
                break;
        }
        // When a postback is called, we'll send a message back to the sender to
        // let them know it was successful
    },

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    receivedMessageRead: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;

        console.log("Received message read event for watermark %d and sequence " +
            "number %d", watermark, sequenceNumber);
    },

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    receivedAccountLink: function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        var status = event.account_linking.status;
        var authCode = event.account_linking.authorization_code;

        console.log("Received account link event with for user %d with status %s " +
            "and auth code %s ", senderID, status, authCode);
    },


    /*
     * Send a Gif using the Send API.
     *
     */
    sendImageMessage: function (recipientId, path) {
        console.log(SERVER_URL + path);
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: SERVER_URL + path
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send audio using the Send API.
     *
     */
    sendAudioMessage: function (recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: SERVER_URL + "/assets/sample.mp3"
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a video using the Send API.
     *
     */
    sendVideoMessage: function (recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: SERVER_URL + "/assets/allofus480.mov"
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a file using the Send API.
     *
     */
    sendFileMessage: function (recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: SERVER_URL + "/assets/test.txt"
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a text message using the Send API.
     *
     */
    sendTextMessage: function (recipientId, messageText) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "DEVELOPER_DEFINED_METADATA"
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a button message using the Send API.
     *
     */
    sendButtonMessage: function (recipientId, title, buttons) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: title,
                        buttons: buttons
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a Structured Message (Generic Message type) using the Send API.
     *
     */
    sendGenericMessage: function (recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "rift",
                            subtitle: "Next-generation virtual reality",
                            item_url: "https://www.oculus.com/en-us/rift/",
                            image_url: SERVER_URL + "/assets/rift.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/rift/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for first bubble",
                            }],
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/touch/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for second bubble",
                            }]
                        }]
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a receipt message using the Send API.
     *
     */
    sendReceiptMessage: function (recipientId) {
        // Generate a random receipt ID as the API requires a unique ID
        var receiptId = "order" + Math.floor(Math.random() * 1000);

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "receipt",
                        recipient_name: "Peter Chang",
                        order_number: receiptId,
                        currency: "USD",
                        payment_method: "Visa 1234",
                        timestamp: "1428444852",
                        elements: [{
                            title: "Oculus Rift",
                            subtitle: "Includes: headset, sensor, remote",
                            quantity: 1,
                            price: 599.00,
                            currency: "USD",
                            image_url: SERVER_URL + "/assets/riftsq.png"
                        }, {
                            title: "Samsung Gear VR",
                            subtitle: "Frost White",
                            quantity: 1,
                            price: 99.99,
                            currency: "USD",
                            image_url: SERVER_URL + "/assets/gearvrsq.png"
                        }],
                        address: {
                            street_1: "1 Hacker Way",
                            street_2: "",
                            city: "Menlo Park",
                            postal_code: "94025",
                            state: "CA",
                            country: "US"
                        },
                        summary: {
                            subtotal: 698.99,
                            shipping_cost: 20.00,
                            total_tax: 57.67,
                            total_cost: 626.66
                        },
                        adjustments: [{
                            name: "New Customer Discount",
                            amount: -50
                        }, {
                            name: "$100 Off Coupon",
                            amount: -100
                        }]
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a message with Quick Reply buttons.
     *
     */
    sendQuickReply: function (recipientId, title, payload) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: title,
                quick_replies: payload
            }
        };
        return this.callSendAPI(messageData);
    },

    /*
     * Send a read receipt to indicate the message has been read
     *
     */
    sendReadReceipt: function (recipientId) {
        console.log("Sending a read receipt to mark message as seen");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        this.callSendAPI(messageData);
    },

    /*
     * Turn typing indicator on
     *
     */
    sendTypingOn: function (recipientId) {
        console.log("Turning typing indicator on");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Turn typing indicator off
     *
     */
    sendTypingOff: function (recipientId) {
        console.log("Turning typing indicator off");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Send a message with the account linking call-to-action
     *
     */
    sendAccountLinking: function (recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Welcome. Link your account.",
                        buttons: [{
                            type: "account_link",
                            url: SERVER_URL + "/authorize"
                        }]
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    },

    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    callSendAPI: function (messageData) {
      let deferred = Q.defer()
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                        return deferred.resolve(response);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                        return deferred.resolve(response);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
                return deferred.reject(error);
            }
        });
        return deferred.promise
    }

};

export default facebook;
