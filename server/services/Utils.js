import Q from 'q'
import path from'path'
import request from 'request'
import fs from 'fs'

class Utils
{
    constructor()
    {

    }


    getImageBuffer(url, fileHash)
    {
        let deferred = Q.defer()

        
        let filePath = path.join(__dirname, "../tmp/", fileHash+'.jpg');

        request(url).pipe(fs.createWriteStream(filePath)).on('close', function(){

            fs.readFile(filePath, function(err,data){
                if (!err){
                    console.log('received data: ' + data.length);
                    //response.writeHead(200, {'Content-Type': 'text/html'});
                    //response.write(data);
                    //response.end();
                    return deferred.resolve(data);

                }else{
                    console.log(err);
                }

            });

        });


        return deferred.promise



    }


    deleteImage(file)
    {

        return fs.unlinkSync(__dirname + "/../tmp/" + file);

    }



}

export default new Utils()
