import facebook from '../facebook'
import config from 'config'
import slugify from 'slugify'
import UserProfile from './UserProfile'
import Utils from './Utils'
//import S3Service from 'services/S3Service'
import crypto from 'crypto'
//import ExampleModel from 'models/ExampleModel'

class Flow {


  constructor() {
    this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

    this._all_users = {};
  }
  

  receivedMessage(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfMessage = event.timestamp;
    let message = event.message;

    //Validate if user exist on array
    /*if (!this._all_users[senderID]) {

    //Get Profile Data
    UserProfile.getUserProfile(senderID).then((data) => {
    console.log(data);
    this._all_users[senderID] = {name : data.first_name};
  });

}*/


var messageId = message.mid;
var appId = message.app_id;
var metadata = message.metadata;

// You may get a text or attachment but not both
var messageText = message.text;
var messageAttachments = message.attachments;
var quickReply = message.quick_reply;


if (quickReply) {
  var quickReplyPayload = quickReply.payload;
  console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
  this.quickReplyPayload(senderID,recipientID,quickReplyPayload, userCurrent);
  return;
}

if (messageText) {



  var txt_as_command = slugify(messageText).toLowerCase();
  switch (txt_as_command) {
    case 'hola':
    facebook.sendTextMessage(senderID, 'Mundo');
    break;
    default:

  }
} else if (messageAttachments) {

  //Message Attachments
  if (messageAttachments.length > 0)
  {
    for (let attachment of messageAttachments) {
      console.log('Attachment: ' + attachment);

      switch (attachment.type)
      {
        case 'image':
        let salt = new Date();
        const hash = crypto.createHash('sha256');
        hash.update(salt.getTime().toString());
        let fileHash = hash.digest('hex');


        facebook.sendTextMessage(senderID, "Gracias recibimos tu imágen");
        break;

        case 'audio':
        facebook.sendTextMessage(senderID, "Gracias recibimos tu audio");
        break;

        case 'video':
        facebook.sendTextMessage(senderID, "Gracias recibimos tu video");
        break;

        case 'file':
        facebook.sendTextMessage(senderID, "Gracias recibimos tu archivo");
        break;

        case 'location':
        console.log('Attachment: ' + attachment.payload.coordinates.lat);
        console.log('Attachment: ' + attachment.payload.coordinates.long);
        facebook.sendTextMessage(senderID, "Gracias recibimos tu ubicación");
        break;
      }


    }
  }

}

}

receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
  "at %d", senderID, recipientID, payload, timeOfPostback);

}


quickReplyPayload(senderID,recipientID,payload, userCurrent)
{
  console.log(senderID);
}


}

export default new Flow()
