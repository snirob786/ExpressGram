const mongoose = require('mongoose');
require('dotenv').config();

let mongoUrl = `mongodb://localhost:27017/${process.env.MONGO_DB_NAME}` 

mongoose.connect(mongoUrl)
.then(()=>{
    console.log("Databse is connected.");
})
.catch((error)=>{
    console.log(error.message);
})