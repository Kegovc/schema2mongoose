const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let funErrRef = (find,value)=>{
    let item = new Promise((res,rej)=>{
    find.then(doc=>{
            if (!doc) {
                rej(`Ref, ${value.name} is not a valid`)
                return false
            } else {
                res(`Ref, ${value.name} is a valid`)
            return true
            }
        })
    })
    arrToValue.push(item)
}
let arrToValue = []
let db = null
const makeType = type =>{
    switch(type){
        case 'string': return String
        case 'number': return Number
        case 'date': return Date
        case 'buffer': return Buffer
        case 'boolean': return Boolean
        case 'id': return Schema.Types.ObjectId
        default: return String
    }
}

const makeFormat = (type, value = undefined) => {
    switch(type){
        case 'integer':{
            return{
                validator: v => Number.isInteger(v)  , 
                message: props => `${props.path} is not a valid`    
            }
        }
        case 'pattern':{
           return {
               validator: v => value.test(v), 
               message: props => `${props.path} is not a valid`
            }
        }
        case 'email':{
           return {
               validator: v => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v), 
               message: props => `${props.path} is not a valid`
            }
        }
        case 'ref':{
           return {
               validator: (v) => {
                    const RefColecction = db.model(value.name, new Schema());
                    let a = RefColecction.findOne({[value.key]: v})
                    funErrRef(a,value)
                    return true
                }, 
               message: props => `Ref, ${props.path} is not a valid`
            }
        }
        default:{
            console.log({makeFormat: type, value})
        }
    }
}

const makeAtributs = description =>{
    
    for(let key in description){
        
        switch(key){
            case 'type': {
                if(description[key]==='object'){
                    return make(description.properties)
                } else if(description[key]==='array'){
                    return makeAtributs(description.items)
                } else{
                    description[key] = makeType(description[key])
                }
                break
            }
            case 'pattern':{
                let validate = makeFormat('pattern',description[key])
                if(description.hasOwnProperty('validate')){
                    description.validate.push(validate)
                } else{
                    description.validate = [validate]
                }
                delete description[key]
                break 
            }
            case 'format':{
                let validate = makeFormat(description[key])
                if(description.hasOwnProperty('validate')){
                    description.validate.push(validate)
                } else{
                    description.validate = [validate]
                }
                delete description[key]
                break 
            }
            case 'relation':{
                description.ref = description.relation.ref
                let validate = makeFormat('ref',{name:description.relation.ref,key:description.relation.foreignKey||'_id'})
                if(description.hasOwnProperty('validate')){
                    description.validate.push(validate)
                } else{
                    description.validate = [validate]
                }
                delete description[key]
                break
            }
            case 'min':
            case 'max':
            case 'required':
                break
            default:{
                console.log('key',key,description[key])
            }
        }
    }
    return description
}

const make = (json) =>{
    
    for(let key in json){
        json[key]=makeAtributs(json[key])
    }
    return json
}

module.exports = db_ =>{
    db = db_
        return ( schema, obj = {listOfValidate: []}) =>{
            arrToValue = obj.listOfValidate
            let make_ = make(schema)
            return new Schema(make_)
        }
    }