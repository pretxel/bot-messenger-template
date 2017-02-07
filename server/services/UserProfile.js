import curl from 'curlrequest'
import config from 'config'
import Q from 'q'

class UserProfile
{
    constructor()
    {
        this.userProfile_url = 'https://graph.facebook.com/v2.8/';
        this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
            (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
            config.get('pageAccessToken');
    }


    getUserProfile(idUser)
    {
        let deferred = Q.defer()
        let options = {
            url: this.userProfile_url+idUser+'?access_token='+this.PAGE_ACCESS_TOKEN
        };

        curl.request(options, (err, data) => {

            return deferred.resolve(data);
        });

        return deferred.promise
    }


}

export default new UserProfile()
