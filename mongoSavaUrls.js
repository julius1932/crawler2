var express = require('express');
var mongoose=require('mongoose');
var db=mongoose.connect('mongodb://localhost:27017/urls');
var Schema=mongoose.Schema;
var urlSchema=new Schema({
    url: String
    
});
var userData=mongoose.model('links',urlSchema);
exports.saveData = function (item) { // making saveData acessible by  outside world
       var data=new userData(item);
       data.save();
}
exports.closeConnection= function () { //closing connection
   mongoose.connection.close();
}