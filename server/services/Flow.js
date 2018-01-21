import winston from "winston";
import _ from "lodash";
import Presenter from "../presenters";
import Utils from "../libs/Utils";


class Flow{

    constructor() {
      
    }


    receivedMessage(context, currentUser) {
        const recipientID = context.recipient.id;
        const senderID = context.sender.id;
        const message = context.message;
        const messageText = message.text;
        const messageAttachments = message.attachments;
        const quickReply = message.quick_reply;
        let data = {};

        if (quickReply) {
            this.quickReplyPayload(recipientID, senderID, quickReply.payload, currentUser);
            return;
          }


        Presenter.showWelcome(senderID, currentUser, data)

    }


    receivedPostback(context, currentUser) {
        const senderID = context.sender.id;
        const recipientID = context.recipient.id;
        const timeOfPostback = context.timestamp;
        const payload = context.postback.payload;
        const referral = context.postback.referral;
    
    
    }



    quickReplyPayload(recipientID, senderID, payload, userCurrent) {
        winston.info(payload);
        const obAction = JSON.parse(payload);
        obAction.data.copies = this.Copies;
        //QuickReplies[obAction.type](senderID, userCurrent, obAction.data);
    }


}

module.exports = Flow;