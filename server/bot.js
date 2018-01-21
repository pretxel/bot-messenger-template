require("babel-core/register");
require("babel-polyfill");
import winston from "winston";
import uuid from "uuid";
import config from "config";
import express from "express";
import bodyParser from "body-parser";
import facebook from "./facebook";
import request from "request";
import Presenter from "./presenters";



const ENV = (process.env.ENV) ?
  process.env.ENV :
  config.get("env");

const APP_NAME = (process.env.APP_NAME) ?
  process.env.APP_NAME :
  config.get("app_name");

const PORT = (process.env.PORT) ?
  process.env.PORT :
  config.get("port");

const LEVEL_LOGGING = (process.env.LEVEL_LOGGING) ?
  (process.env.LEVEL_LOGGING) :
  config.get("levelLogging");

// MongoDB Connection
/*
const HOST_NAME = (process.env.HOST_NAME) ?
  process.env.HOST_NAME :
  config.get('mongo.hostName');

const DATABASE_NAME = (process.env.DATABASE_NAME) ?
  process.env.DATABASE_NAME :
  config.get('mongo.databaseName');

const USER_NAME = (process.env.USER_NAME) ?
  process.env.USER_NAME :
  config.get('mongo.username');

const PASSWORD = (process.env.PASSWORD) ?
  process.env.PASSWORD :
  config.get('mongo.password');
*/

const VALIDATION_TOKEN = (process.env.VALIDATION_TOKEN) ?
process.env.VALIDATION_TOKEN :
config.get('validationToken');


winston.level = LEVEL_LOGGING;
const idLog = uuid.v1();


const app = express();
app.set("port", PORT);
app.use(bodyParser.json({
  //verify: facebook.verifyRequestSignature
}));


app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === VALIDATION_TOKEN) {
    winston.log("info", "Validating webhook", idLog);
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    winston.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});



app.post("/webhook", (req, res) => {
  const data = req.body;
  try {
    if (data.object === "page") {
      data.entry.forEach((pageEntry) => {
        const pageID = pageEntry.id;

        if (pageEntry.messaging) {
          //console.info('Received:');
          //console.info(pageEntry);
          //console.info(pageEntry.messaging);
          //console.info('-----');

          pageEntry.messaging.forEach((messagingEvent) => {
            winston.log('info','Ejecutando evento:');
            winston.log('info',messagingEvent);
            winston.log('info','-----');


            if (messagingEvent.referral) {

              //Presenter.receivedReferral(messagingEvent);
            } else if (messagingEvent.option) {
              //facebook.receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
              if (messagingEvent.message.is_echo !== true) {
                Presenter.receivedMessage(messagingEvent);
              }
            } else if (messagingEvent.delivery) {
              //facebook.receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.read) {
              //facebook.receivedMessageRead(messagingEvent);
            } else if (messagingEvent.account_linking) {
              //facebook.receivedAccountLink(messagingEvent);
            } else if (messagingEvent.postback) {
              //Presenter.receivedPostback(messagingEvent);
            } else {
              winston.log("info", `Webhook received unknown messagingEvent: ${messagingEvent}`);
            }
          });
        }

      });
      res.sendStatus(200);
    }
  } catch (e) {
    winston.error(e);
  }
});



app.listen(app.get("port"), () => {
  winston.log("info", `${APP_NAME} is running on port ${app.get("port")}`);
  winston.log("info", `${ENV} environment`);
  //ThreadSettings.setGreetingText();
  //ThreadSettings.setGetStartedButton();
});

module.exports = app;
