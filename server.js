const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine','ejs');

app.get('/',(req,res)=>{
    res.render('index', {title: "Login System"})
})


app.listen(port, ()=>{console.log("Listening to port: ", port)})