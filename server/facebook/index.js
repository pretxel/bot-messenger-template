require("babel-core/register");
require("babel-polyfill");
import crypto from 'crypto';
import request from 'request-promise';
import config from 'config';
import winston from 'winston';
import striptags from "striptags";


class Facebook {

    constructor() {
        this.APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
            process.env.MESSENGER_APP_SECRET :
            config.get("appSecret");


        this.VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
            (process.env.MESSENGER_VALIDATION_TOKEN) :
            config.get("validationToken");


        this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
            (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
            config.get("pageAccessToken");


        this.SERVER_URL = (process.env.SERVER_URL) ?
            (process.env.SERVER_URL) :
            config.get("serverURL");

        this.LEVEL_LOGGING = (process.env.LEVEL_LOGGING) ?
            (process.env.LEVEL_LOGGING) :
            config.get("levelLogging");

        this._all_users = {};

        winston.level = this.LEVEL_LOGGING;
    }

    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    static verifyRequestSignature(req, res, buf) {
        const signature = req.headers["x-hub-signature"];
        const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
            process.env.MESSENGER_APP_SECRET :
            config.get("appSecret");

        if (!signature) {
            winston.error("Couldn't validate the signature.");
        } else {
            const elements = signature.split("=");
            // const method = elements[0];
            const signatureHash = elements[1];

            // winston.log("VAL: " + APP_SECRET);
            const expectedHash = crypto.createHmac("sha1", APP_SECRET)
                .update(buf)
                .digest("hex");

            if (signatureHash !== expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    receivedAuthentication(event, senderID) {
        const recipientID = event.recipient.id;
        const timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        const passThroughParam = event.optin.ref;

        winston.log("debug",
            "Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam,
            timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage(senderID, "Authentication successful");
    }


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation(event) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;
        const delivery = event.delivery;
        const messageIDs = delivery.mids;
        const watermark = delivery.watermark;
        const sequenceNumber = delivery.seq;

        if (messageIDs) {
            messageIDs.forEach((messageID) => {
                winston.log("debug", "Received delivery confirmation for message ID: %s", messageID);
            });
        }

        winston.log("debug", "All message before %d were delivered.", watermark);
    }

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    static receivedMessageRead(event) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        const watermark = event.read.watermark;
        const sequenceNumber = event.read.seq;

        winston.log("debug", "Received message read event for watermark %d and sequence " +
            "number %d", watermark, sequenceNumber);
    }

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    static receivedAccountLink(event) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;

        const status = event.account_linking.status;
        const authCode = event.account_linking.authorization_code;

        winston.log("debug", "Received account link event with for user %d with status %s " +
            "and auth code %s ", senderID, status, authCode);
    }


    /*
     * Send a Gif using the Send API.
     *
     */
    sendImageMessage = async (recipientId, path)  => {
        //winston.log("debug", this.SERVER_URL + path);
        //winston.log(this.SERVER_URL);
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: path
                    }
                }
            }
        };
        return this.callSendAPI(messageData);
    }

    /*
     * Send audio using the Send API.
     *
     */
    sendAudioMessage = async (recipientId, url) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    }


    sendVideoMessage = async (recipientId, url) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: url,
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    }



    /*
     * Send a file using the Send API.
     *
     */
    sendFileMessage = async (recipientId) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: `${this.SERVER_URL}/assets/test.txt`
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Send a text message using the Send API.
     *
     */
    sendTextMessage = async (recipientId, messageText) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "DEVELOPER_DEFINED_METADATA"
            }
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Send a button message using the Send API.
     *
     */
    sendButtonMessage = async (recipientId, title, buttons)  => {
        const messageData = {
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
    }

   

    sendGeneric = async (recipientId, message) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message
        };


        return this.callSendAPI(messageData);
    }


    sendListWithOptions = async (recipientId, listParam, buttons) => {
        buttons = typeof buttons !== "undefined" ? buttons : "";

        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: listParam,
                        buttons
                    }
                }
            }
        };
        return this.callSendAPI(messageData);
    }


    sendMessageWithOptions = async (recipientId, messageParam, optionsParam, value, extraParam) => {
        extraParam = typeof extraParam !== "undefined" ? extraParam : "";
        value = typeof value !== "undefined" ? value : "";
        const options = [];
        const extra = (extraParam != "" ? `|${extraParam}` : "");
        for (let i = 0; i < optionsParam.length; i++) {
            const extraValue = JSON.parse(optionsParam[i].action);
            if (value != "") {
                extraValue.data.prevId = value;
                optionsParam[i].action = JSON.stringify(extraValue);
            }
            const option = {
                content_type: "text",
                title: optionsParam[i].title,
                payload: optionsParam[i].action,
            };
            if (optionsParam[i].image_url !== undefined) {
                option.image_url = optionsParam[i].image_url;
            }
            options.push(option);
        }

        const message = {
            text: messageParam,
            quick_replies: options
        };


        return this.sendGeneric(recipientId, message);
    }


    sendCarrouselCards = async (recipientId, cardsParam) => {
        const options = [];

        for (let i = 0; i < cardsParam.length; i++) {
            const option = {
                title: cardsParam[i].name,
                image_url: (cardsParam[i].logo !== "" ? cardsParam[i].logo : "https://s3.amazonaws.com/barbie-bot/folders/default.png"),
                subtitle: striptags(cardsParam[i].description),
                /* "default_action": {
                 "type": "web_url",
                 "url": "https://peterssendreceiveapp.ngrok.io/view?item=103",
                 "messenger_extensions": true,
                 "webview_height_ratio": "tall",
                 "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
                 }, */
                buttons: cardsParam[i].buttons
            };

            options.push(option);
        }


        const message = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: options
                }
            }
        };

        // winston.log(message);

        return this.sendGeneric(recipientId, message);
    }

   

    /*
     * Send a message with Quick Reply buttons.
     *
     */
    sendQuickReply = async (recipientId, title, payload) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: title,
                quick_replies: payload
            }
        };
        return this.callSendAPI(messageData);
    }


    sendQuickReplyLocation = async (recipientId, text) => {
        const messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text,
                quick_replies: [{
                    content_type: "location",
                }]
            }
        };
        winston.log("debug", messageData);
        this.callSendAPI(messageData);
    }

    /*
     * Send a read receipt to indicate the message has been read
     *
     */
    sendReadReceipt = async (recipientId) => {
        winston.log("debug", "Sending a read receipt to mark message as seen");

        const messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Turn typing indicator on
     *
     */
    sendTypingOn = async (recipientId) => {
        winston.log("debug", "Turning typing indicator on");

        const messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Turn typing indicator off
     *
     */
    sendTypingOff = async (recipientId)  => {
        winston.log("debug", "Turning typing indicator off");

        const messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Send a message with the account linking call-to-action
     *
     */
    sendAccountLinking = async (recipientId)  => {
        const messageData = {
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
                            url: `${this.SERVER_URL}/authorize`
                        }]
                    }
                }
            }
        };

        return this.callSendAPI(messageData);
    }

    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    callSendAPI = async (messageData) => {
        let response;
        let params = {
            uri: "https://graph.facebook.com/v2.8/me/messages",
            qs: {
                access_token: this.PAGE_ACCESS_TOKEN
            },
            method: "POST",
            json: messageData
        };
        try {
            response = await request(params);
        } catch (err) {
            winston.error(err);
        }
        return response;
    }

   

}

module.exports = new Facebook();
