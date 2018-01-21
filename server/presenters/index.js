import winston from "winston";
import Utils from "../libs/Utils";
import Flow from "../services/Flow";
import Welcome from "./welcome";

const receivedMessage = (event) => {
    const senderID = event.sender.id;
    Utils.validUser(senderID).then(userCurrent => {
      winston.debug(userCurrent);
      new Flow().receivedMessage(event, userCurrent);
    }).catch(err => {
      winston.error(err);
    });
  };
  
  const receivedPostback = (event) => {
    const senderID = event.sender.id;
    Utils.validUser(senderID).then(userCurrent => {
      winston.debug(userCurrent);
      new Flow().receivedPostback(event, userCurrent);
    }).catch(err => {
      winston.error(err);
    });
  };
  
  
  const receivedReferral = (event) => {
    const senderID = event.sender.id;
    Utils.validUser(senderID).then(userCurrent => {
      winston.debug(userCurrent);
      new Flow().receivedReferral(event, userCurrent);
    }).catch(err => {
      winston.error(err);
    });
  };



export default {
    receivedMessage,
    receivedPostback,
    receivedReferral,
    showWelcome: Welcome.showWelcome
};