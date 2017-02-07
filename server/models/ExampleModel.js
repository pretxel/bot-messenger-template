import mongoose from 'mongoose'
import loadClass from 'mongoose-class-wrapper';
import validate from 'mongoose-validator'
import uniqueValidator from 'mongoose-unique-validator'

var ExampleSchema = new mongoose.Schema({
        name : {
            type: String ,
            required : true,
            unique: false,
            validate : [
                validate({
                    validator: 'isLength',
                    arguments: [3, 50],
                    message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
                })
            ]
        }
    },
    {
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    })

class ExampleModel {

    getFillable()
    {
        return ['name']
    }

}

//ExampleSchema.virtual('members').get( () => [])

ExampleSchema.plugin(uniqueValidator)
ExampleSchema.plugin(loadClass, ExampleModel);

export default mongoose.model('Example', ExampleSchema)