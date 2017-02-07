import AWS from 'aws-sdk';
import config from 'config'
import Q from 'q'

class S3Service
{
    constructor()
    {
        this.s3 = new AWS.S3({
            apiVersion: config.get('aws.apiVersion'),
            accessKeyId: config.get('aws.accessKeyId'),
            secretAccessKey: config.get('aws.secretAccessKey'),
            region: config.get('aws.region')
        });
    }


    putObject(bucket, key , data)
    {
        let deferred = Q.defer()

        let params = {
            Bucket: bucket,
            Key: key,
            Body: data
        }

        this.s3.putObject(params, function (err, data) {
            if (err)
            {
                console.log(err)
                return deferred.reject();
            }
            else
            {
                console.log("Successfully uploaded data to " + params.Bucket + "/" + params.Key);
                return deferred.resolve(params.Key);
            }

        });


        return deferred.promise
    }


}

export default new S3Service()
