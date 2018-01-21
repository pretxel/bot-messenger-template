import winston from "winston";
import _ from "lodash";
import Facebook from "../facebook";

const showWelcome = (senderID, userCurrent, data) => {
    return Facebook.sendTextMessage(senderID, "Hola Mundo!");
};

export default {
    showWelcome
};
  