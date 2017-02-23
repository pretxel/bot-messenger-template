import config from 'config'
import request from 'request'
import winston from 'winston'

class AnalyticsService
{
  constructor()
  {
    this.PAGE_ID = (process.env.PAGE_ID) ?
    process.env.PAGE_ID :
    config.get('pageID');

    this.APP_ID = (process.env.APP_ID) ?
    process.env.APP_ID :
    config.get('appID');

    this.access_token = (process.env.ACCESS_TOKEN) ?
    process.env.ACCESS_TOKEN :
    config.get('accessToken');

    this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

    const LEVEL_LOGGING = (process.env.LEVEL_LOGGING) ?
    (process.env.LEVEL_LOGGING) :
    config.get('levelLogging');
    winston.level = LEVEL_LOGGING;
  }

  logEvent(event_name, event_value, senderID, recipientID )
  {

    event_name = event_name ? event_name : '';
    let date = new Date();
    var log_event = {
      event: 'CUSTOM_APP_EVENTS',
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      extinfo: JSON.stringify(['mb1']),
      page_id: this.PAGE_ID,
      page_scoped_user_id: senderID,
      custom_events: JSON.stringify([{
        _eventName: event_name,
        _value: 1,
        fb_success: 1,
        _logTime: date.getTime(),
      }])
    }
    //console.info( log_event );
    request.post({
      url : "https://graph.facebook.com/"+this.APP_ID+"/activities?access_token="+this.access_token,
      form: log_event
    }, function(err,httpResponse,body){
      //console.error("ERROR:");
      //console.error(err);
      if (err != null)
      {
        winston.log('error', err);
      }else {
        winston.log('debug','Send event: ' + event_name + ' senderID: ' + senderID);
      }
    });

  }
}
export default new AnalyticsService()
