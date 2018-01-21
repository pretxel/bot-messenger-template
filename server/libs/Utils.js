import winston from "winston";
import co from "co";
import config from "config";
import _ from "lodash";
import { UserProfile } from "bot-messenger-utils";


class Utils {
    constructor() {
        this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
            (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
            config.get("pageAccessToken");

        this.UserProfile = new UserProfile({
            pageAccessToken: this.PAGE_ACCESS_TOKEN
        });
    }


    // User validation
    validUser(senderID) {
        return this.UserProfile.getUserProfile(senderID).then((userData) => {
            userData.senderID = senderID;
            console.info(userData);
            /*
          return UserRepository.isExistUserBySender(this.APP_ID, senderID).then(dataDB => {
            const dataDynaDB = _.map(dataDB, "attrs");
            if (dataDB.length === 0) {
              userData.senderID = senderID;
              console.info(userData);
              
              return UserRepository.saveUser(this.APP_ID, userData).then((dataResp) => {
                dataResp.exist = false;
                winston.log("debug", "Usuario nuevo", {
                  id: this.idLog
                });
                return dataResp;
              }).catch((error) => {
                winston.error(error, {
                  id: this.idLog
                });
                return error;
              });
              
            }
            dataDynaDB[0].exist = true;
            // winston.info(dataDynaDB);
            winston.debug("Usuario ya existente", { id: this.idLog });
            if (dataDynaDB[0].support) {
              throw new Error("Support Mode");
            }
            
            return dataDynaDB[0];
          }).catch((error) => {
            throw error;
          });
    
          */
        }).catch((error) => {
            winston.error(error);
            throw error;
        });
    }



}

module.exports = new Utils();
